-- Name-check pass over `figures.name_th`: added birth/personal-name parenthetical
-- for royal-titled figures that were missing one, matching the house convention
-- already used elsewhere (e.g. เจ้าพระยาบดินทรเดชา (สิงห์ สิงหเสนี)).
-- Applied live via Supabase MCP 2026-07-15; this file makes the change reproducible.
-- Facts verified against Thai Wikipedia + fine arts department sources — see chat.

UPDATE figures SET name_th = 'สมเด็จพระมหาสมณเจ้า กรมพระยาวชิรญาณวโรรส (พระองค์เจ้ามนุษยนาคมานพ)' WHERE id = 'fig-b-02';
UPDATE figures SET name_th = 'พระเจ้าบรมวงศ์เธอ กรมหลวงชุมพรเขตอุดมศักดิ์ (อาภากรเกียรติวงศ์)' WHERE id = 'fig-s-17';
UPDATE figures SET name_th = 'สมเด็จเจ้าฟ้ากรมพระยานริศรานุวัดติวงศ์ (จิตรเจริญ)' WHERE id = 'fig-s-18';
UPDATE figures SET name_th = 'กรมพระยาดำรงราชานุภาพ (ดิศวรกุมาร)' WHERE id = 'fig-s-20';
UPDATE figures SET name_th = 'สมเด็จพระเจ้าตากสินมหาราช (สิน)' WHERE id = 'fig-s-01';
UPDATE figures SET name_th = 'สมเด็จพระนเรศวรมหาราช (พระองค์ดำ)' WHERE id = 'fig-s-10';
UPDATE figures SET name_th = 'พระนางเจ้าสุวัทนา พระวรราชเทวี (เครือแก้ว อภัยวงศ์)' WHERE id = 'fig-a-19';
