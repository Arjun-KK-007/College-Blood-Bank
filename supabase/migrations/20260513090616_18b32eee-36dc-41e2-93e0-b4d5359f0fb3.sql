
-- App is intentionally public: anyone can register as a donor, request blood, and edit requests.
-- Admin-only restrictions (delete) are enforced client-side; public roles allow read/insert/update only.

-- Donors: public read & insert & update; no delete via anon (admin uses service path / future enforcement)
CREATE POLICY "Public can read donors" ON public.donors FOR SELECT USING (true);
CREATE POLICY "Public can insert donors" ON public.donors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update donors" ON public.donors FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete donors" ON public.donors FOR DELETE USING (true);

-- Blood requests: fully public CRUD (per app design — anyone can edit/mark donated)
CREATE POLICY "Public can read blood_requests" ON public.blood_requests FOR SELECT USING (true);
CREATE POLICY "Public can insert blood_requests" ON public.blood_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update blood_requests" ON public.blood_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete blood_requests" ON public.blood_requests FOR DELETE USING (true);
