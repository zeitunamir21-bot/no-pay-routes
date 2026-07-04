-- 1) Replace reserve_seats(...p_user_id) to trust only auth.uid()
DROP FUNCTION IF EXISTS public.reserve_seats(uuid, text, text, integer, text, text, integer[], uuid);

CREATE OR REPLACE FUNCTION public.reserve_seats(
  p_trip_id uuid,
  p_customer_name text,
  p_phone text,
  p_seats integer,
  p_pickup_location text,
  p_destination text,
  p_seat_numbers integer[],
  p_user_id uuid
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking public.bookings;
  v_uid uuid := auth.uid();
BEGIN
  -- Reject client-supplied user ids that don't match the caller's session.
  IF p_user_id IS NOT NULL AND v_uid IS NOT NULL AND p_user_id <> v_uid THEN
    RAISE EXCEPTION 'User id does not match authenticated session';
  END IF;

  v_booking := public.reserve_seats(
    p_trip_id, p_customer_name, p_phone, p_seats,
    p_pickup_location, p_destination, p_seat_numbers
  );

  -- Attribute booking strictly to the authenticated caller (never to a spoofed id).
  IF v_uid IS NOT NULL THEN
    UPDATE public.bookings SET user_id = v_uid
      WHERE id = v_booking.id
      RETURNING * INTO v_booking;
  END IF;

  RETURN v_booking;
END;
$function$;

-- 2) New overload that atomically applies + redeems a promo code inside the booking transaction.
CREATE OR REPLACE FUNCTION public.reserve_seats_with_promo(
  p_trip_id uuid,
  p_customer_name text,
  p_phone text,
  p_seats integer,
  p_pickup_location text,
  p_destination text,
  p_seat_numbers integer[],
  p_promo_code text,
  p_subtotal numeric
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking public.bookings;
  v_uid uuid := auth.uid();
  v_promo public.promo_codes;
  v_discount numeric := 0;
  v_code text;
BEGIN
  v_booking := public.reserve_seats(
    p_trip_id, p_customer_name, p_phone, p_seats,
    p_pickup_location, p_destination, p_seat_numbers, v_uid
  );

  IF p_promo_code IS NOT NULL AND length(trim(p_promo_code)) > 0 THEN
    v_code := upper(trim(p_promo_code));

    -- Lock the promo row so uses/max_uses check + increment happen atomically.
    SELECT * INTO v_promo FROM public.promo_codes
      WHERE upper(code) = v_code AND active = true
      FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid promo code';
    END IF;
    IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
      RAISE EXCEPTION 'Promo code expired';
    END IF;
    IF v_promo.max_uses IS NOT NULL AND v_promo.uses >= v_promo.max_uses THEN
      RAISE EXCEPTION 'Promo code fully redeemed';
    END IF;

    IF v_promo.discount_pct IS NOT NULL THEN
      v_discount := round(GREATEST(p_subtotal, 0) * v_promo.discount_pct / 100.0);
    ELSE
      v_discount := LEAST(v_promo.discount_amount, GREATEST(p_subtotal, 0));
    END IF;

    UPDATE public.promo_codes
      SET uses = uses + 1, updated_at = now()
      WHERE id = v_promo.id;

    UPDATE public.bookings
      SET promo_code = v_promo.code, discount_amount = v_discount
      WHERE id = v_booking.id
      RETURNING * INTO v_booking;
  END IF;

  RETURN v_booking;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.reserve_seats_with_promo(uuid, text, text, integer, text, text, integer[], text, numeric)
  TO anon, authenticated;

-- 3) Lock down redeem_promo so it can no longer be called directly by clients
--    to exhaust max_uses outside of the booking flow. Booking flow now uses
--    reserve_seats_with_promo, which handles increment atomically.
REVOKE ALL ON FUNCTION public.redeem_promo(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo(text) TO service_role;