-- 1. Mask PII in get_booking_details for anonymous callers
CREATE OR REPLACE FUNCTION public.get_booking_details(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v_booking public.bookings%rowtype;
  v_trip public.trips%rowtype;
  v_driver jsonb;
  v_booking_json jsonb;
  v_trip_json jsonb;
  v_is_auth boolean := auth.uid() IS NOT NULL;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    return null;
  end if;
  select * into v_trip from public.trips where id = v_booking.trip_id;

  v_booking_json := to_jsonb(v_booking);
  v_trip_json := to_jsonb(v_trip);

  if not v_is_auth then
    -- Mask customer phone for anonymous confirmation pages
    v_booking_json := v_booking_json || jsonb_build_object(
      'phone', CASE WHEN length(v_booking.phone) > 3
                    THEN repeat('•', greatest(length(v_booking.phone) - 3, 1)) || right(v_booking.phone, 3)
                    ELSE '•••' END
    );
  end if;

  if v_trip.owner_id is not null then
    select to_jsonb(d) - 'user_id' into v_driver
    from (
      select id, full_name, photos
      from public.drivers
      where user_id = v_trip.owner_id
      limit 1
    ) d;
  end if;

  return jsonb_build_object(
    'booking', v_booking_json,
    'trip', v_trip_json,
    'driver', v_driver
  );
end;
$function$;

-- 2. Add length guards to reserve_seats
CREATE OR REPLACE FUNCTION public.reserve_seats(p_trip_id uuid, p_customer_name text, p_phone text, p_seats integer, p_pickup_location text, p_destination text)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_trip public.trips;
  v_booking public.bookings;
  v_taken integer[];
  v_assigned integer[] := '{}';
  i integer;
BEGIN
  IF p_seats < 1 OR p_seats > 10 THEN
    RAISE EXCEPTION 'Invalid seat count';
  END IF;
  IF length(trim(p_customer_name)) = 0 OR length(trim(p_phone)) = 0 THEN
    RAISE EXCEPTION 'Name and phone required';
  END IF;
  IF length(trim(p_customer_name)) > 100
     OR length(trim(p_phone)) > 20
     OR length(trim(coalesce(p_pickup_location, ''))) > 120
     OR length(trim(coalesce(p_destination, ''))) > 120 THEN
    RAISE EXCEPTION 'Input exceeds maximum allowed length';
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trip not found'; END IF;
  IF v_trip.available_seats < p_seats THEN
    RAISE EXCEPTION 'Not enough seats available';
  END IF;

  SELECT COALESCE(array_agg(s), '{}')
    INTO v_taken
    FROM (
      SELECT unnest(seat_numbers) AS s
      FROM public.bookings
      WHERE trip_id = p_trip_id
    ) t;

  FOR i IN 1..v_trip.total_seats LOOP
    IF NOT (i = ANY(v_taken)) THEN
      v_assigned := array_append(v_assigned, i);
      EXIT WHEN array_length(v_assigned, 1) = p_seats;
    END IF;
  END LOOP;

  IF array_length(v_assigned, 1) IS DISTINCT FROM p_seats THEN
    RAISE EXCEPTION 'Not enough seats available';
  END IF;

  UPDATE public.trips
    SET available_seats = available_seats - p_seats,
        updated_at = now()
    WHERE id = p_trip_id;

  INSERT INTO public.bookings (trip_id, customer_name, phone, seats, pickup_location, destination, seat_numbers)
  VALUES (p_trip_id, trim(p_customer_name), trim(p_phone), p_seats, trim(p_pickup_location), trim(p_destination), v_assigned)
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$function$;

-- 3. Explicitly block self-role insertion (defense in depth)
DROP POLICY IF EXISTS "Block self role insert" ON public.user_roles;
CREATE POLICY "Only admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Remove drivers table from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'drivers'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.drivers';
  END IF;
END$$;

-- 5. Restrict driver-photos bucket listing (direct URL access still works for public buckets)
DROP POLICY IF EXISTS "Driver photos are publicly viewable" ON storage.objects;
CREATE POLICY "Drivers and admins can list own photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-photos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);