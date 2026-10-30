CREATE TABLE public.schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  category TEXT CHECK (category IN ('young-engineers', 'spouses', 'technical', 'social')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.schedule_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schedule_events TO authenticated;
GRANT ALL ON public.schedule_events TO service_role;

CREATE POLICY "Anyone views published programme"
  ON public.schedule_events FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Admins manage published programme"
  ON public.schedule_events FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER trg_schedule_events_updated_at
  BEFORE UPDATE ON public.schedule_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.schedule_events (day, title, time, location, category, sort_order)
SELECT day, title, time, location, category, sort_order
FROM jsonb_to_recordset(
  '[
    {"day":1,"title":"Registration/Arrival","time":"8:00am - 6:00pm","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":1},
    {"day":1,"title":"Tour / Industrial Visit","time":"8:00am - 4:00pm","location":"Engineering project sites across Maiduguri","category":"technical","sort_order":2},
    {"day":1,"title":"Press Conference","time":"9:30am - 10:30am","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":3},
    {"day":1,"title":"Fellowship Symposium","time":"10:00am - 1:00pm","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":4},
    {"day":1,"title":"Courtesy Visit to Host Governor","time":"1:00pm","location":"Borno State Government House","category":"social","sort_order":5},
    {"day":1,"title":"Fellowship Conferment Ceremony","time":"2:00pm - 4:00pm","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":6},
    {"day":1,"title":"Presidential Cocktail Party","time":"6:00pm - 8:00pm","location":"","category":"social","sort_order":7},
    {"day":2,"title":"Registration","time":"8:00am - 6:00pm","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":1},
    {"day":2,"title":"Opening Ceremony","time":"10:00am - 12:30pm","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":2},
    {"day":2,"title":"Lunch Break","time":"12:30pm - 1:00pm","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":3},
    {"day":2,"title":"Spouses Programme","time":"1:00pm - 5:00pm","location":"Muhammadu Indimi International Conference Centre","category":"spouses","sort_order":4},
    {"day":2,"title":"Young Engineers Programme","time":"1:00pm - 5:00pm","location":"Academic Staff Union of Universities (ASUU) hall","category":"young-engineers","sort_order":5},
    {"day":2,"title":"Panel Discussion Session 1","time":"1:00pm - 2:10pm","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":6},
    {"day":2,"title":"Poster Session 1 (All participants to visit the stand)","time":"2:10pm - 2:40pm","location":"","category":"technical","sort_order":7},
    {"day":2,"title":"Panel Discussion Session 2","time":"2:20pm - 3:30pm","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":8},
    {"day":2,"title":"Poster Session 2 (All participants to visit the stand)","time":"3:00pm - 3:30pm","location":"","category":"technical","sort_order":9},
    {"day":2,"title":"Panel Discussion Session 3","time":"3:30pm - 4:40pm","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":10},
    {"day":2,"title":"Election Manifesto","time":"5:00pm - 8:00pm","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":11},
    {"day":3,"title":"Registration","time":"9:00am - 6:00pm","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":1},
    {"day":3,"title":"Spouses Programme","time":"9:00am - 6:00pm","location":"Muhammadu Indimi International Conference Centre","category":"spouses","sort_order":2},
    {"day":3,"title":"Young Engineers Programme","time":"9:00am - 6:00pm","location":"Academic Staff Union of Universities (ASUU) hall","category":"young-engineers","sort_order":3},
    {"day":3,"title":"Leadership and Energy Talks","time":"9:00am - 10:00am","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":4},
    {"day":3,"title":"Technical Session 1","time":"10:00am - 11:00am","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":5},
    {"day":3,"title":"Panel Discussion Session 4","time":"11:00am - 12:15pm","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":6},
    {"day":3,"title":"Lunch Break","time":"12:15pm - 12:45pm","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":7},
    {"day":3,"title":"Panel Discussion Session 5","time":"12:45pm - 2:00pm","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":8},
    {"day":3,"title":"Poster Session 3 (All participants to visit the stand)","time":"2:00pm - 2:30pm","location":"","category":"technical","sort_order":9},
    {"day":3,"title":"Panel Discussion Session 6","time":"2:30pm - 4:00pm","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":10},
    {"day":3,"title":"Group Dynamics Competition (Branches and Divisions)","time":"4:00pm - 6:00pm","location":"International Conference Centre (ICC) Main hall","category":"social","sort_order":11},
    {"day":3,"title":"Welfare/Cultural Night","time":"6:00pm - 8:00pm","location":"","category":"social","sort_order":12},
    {"day":4,"title":"Presentation of Communique and Closing ceremony","time":"9:00am - 10:00pm","location":"","category":"technical","sort_order":1},
    {"day":4,"title":"Annual General Meeting (AGM)","time":"10:00am - 1:00pm","location":"International Conference Centre (ICC) Main hall","category":"technical","sort_order":2},
    {"day":4,"title":"Lunch Break","time":"1:00pm - 2:00pm","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":3},
    {"day":4,"title":"Annual Dinner / Gala Night","time":"6:00pm - 9:00pm","location":"","category":"social","sort_order":4},
    {"day":5,"title":"Closing Press Conference","time":"10:00am - 11:00am","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":1},
    {"day":5,"title":"Departure","time":"11:00am","location":"International Conference Centre (ICC) Main hall","category":null,"sort_order":2}
  ]'::jsonb
) AS programme(day INTEGER, title TEXT, time TEXT, location TEXT, category TEXT, sort_order INTEGER);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'schedule_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_events;
  END IF;
END;
$$;
