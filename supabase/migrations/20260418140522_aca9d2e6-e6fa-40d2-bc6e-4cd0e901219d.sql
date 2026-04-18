-- Donors table
CREATE TABLE public.donors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  last_donated TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view donors"
  ON public.donors FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert donors"
  ON public.donors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update donors"
  ON public.donors FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete donors"
  ON public.donors FOR DELETE
  USING (true);

-- Blood requests table
CREATE TABLE public.blood_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  phone TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT '',
  hospital_name TEXT NOT NULL DEFAULT '',
  hospital_location TEXT NOT NULL DEFAULT '',
  donated BOOLEAN NOT NULL DEFAULT false,
  donated_date TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blood requests"
  ON public.blood_requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert blood requests"
  ON public.blood_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update blood requests"
  ON public.blood_requests FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete blood requests"
  ON public.blood_requests FOR DELETE
  USING (true);

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_donors_updated_at
  BEFORE UPDATE ON public.donors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at
  BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();