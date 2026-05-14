-- Convert legacy 1-5 star values to the new 1-19 rank ladder.
-- Mapping:
-- 1 -> Bronze 3 (1)
-- 2 -> Silber 2 (5)
-- 3 -> Dia 3 (10)
-- 4 -> Platin 1 (15)
-- 5 -> Challenger (19)

UPDATE "Rating"
SET "stars" = CASE "stars"
  WHEN 1 THEN 1
  WHEN 2 THEN 5
  WHEN 3 THEN 10
  WHEN 4 THEN 15
  WHEN 5 THEN 19
  ELSE "stars"
END
WHERE "stars" BETWEEN 1 AND 5;

UPDATE "ProfileRating"
SET "stars" = CASE "stars"
  WHEN 1 THEN 1
  WHEN 2 THEN 5
  WHEN 3 THEN 10
  WHEN 4 THEN 15
  WHEN 5 THEN 19
  ELSE "stars"
END
WHERE "stars" BETWEEN 1 AND 5;
