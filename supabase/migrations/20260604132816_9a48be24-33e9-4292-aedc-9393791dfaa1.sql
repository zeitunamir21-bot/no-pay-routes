
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_pct integer CHECK (discount_pct IS NULL OR (discount_pct > 0 AND discount_pct <= 100)),
  discount_amount numeric CHECK (discount_amount IS NULL OR discount_amount > 0),
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  valid_until timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((discount_pct IS NOT NULL) OR (discount_amount IS NOT NULL))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT SELECT ON public.promo_codes TO anon;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.apply_promo(p_code text, p_subtotal numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v public.promo_codes;
  v_discount numeric := 0;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Enter a code');
  END IF;
  SELECT * INTO v FROM public.promo_codes
    WHERE upper(code) = upper(trim(p_code)) AND active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Invalid code');
  END IF;
  IF v.valid_until IS NOT NULL AND v.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Code expired');
  END IF;
  IF v.max_uses IS NOT NULL AND v.uses >= v.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Code fully redeemed');
  END IF;
  IF v.discount_pct IS NOT NULL THEN
    v_discount := round(p_subtotal * v.discount_pct / 100.0);
  ELSE
    v_discount := LEAST(v.discount_amount, p_subtotal);
  END IF;
  RETURN jsonb_build_object(
    'valid', true, 'code', v.code, 'description', v.description,
    'discount', v_discount, 'final_total', GREATEST(0, p_subtotal - v_discount)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_promo(p_code text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.promo_codes
    SET uses = uses + 1, updated_at = now()
    WHERE upper(code) = upper(trim(p_code)) AND active = true;
$$;

INSERT INTO public.promo_codes (code, description, discount_pct, discount_amount, active)
VALUES
  ('WELCOME10', 'First-time booking discount', 10, NULL, true),
  ('FRIEND50', 'Referral bonus - KES 50 off', NULL, 50, true)
ON CONFLICT (code) DO NOTHING;
