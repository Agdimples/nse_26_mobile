INSERT INTO public.chat_rooms (name, sort_order)
SELECT category.name, category.sort_order
FROM (
  VALUES
    ('General', 1),
    ('Technical Track', 2),
    ('Young Engineers', 3),
    ('Spouses', 4)
) AS category(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.chat_rooms AS existing
  WHERE lower(existing.name) = lower(category.name)
);
