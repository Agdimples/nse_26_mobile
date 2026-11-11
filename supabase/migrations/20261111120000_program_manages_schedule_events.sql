-- Let the program department manage the published programme, matching the
-- department-scoped policies used for sessions and speakers.
DROP POLICY IF EXISTS "Dept program manages schedule events" ON public.schedule_events;
CREATE POLICY "Dept program manages schedule events"
  ON public.schedule_events FOR ALL TO authenticated
  USING (public.staff_role(auth.uid()) IN ('super_admin', 'admin', 'program'))
  WITH CHECK (public.staff_role(auth.uid()) IN ('super_admin', 'admin', 'program'));
