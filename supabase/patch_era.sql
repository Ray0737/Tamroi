-- patch_era.sql — add era column to figures table
-- Run in Supabase SQL Editor after schema.sql

ALTER TABLE figures ADD COLUMN IF NOT EXISTS era TEXT;

UPDATE figures SET era = 'รัตนโกสินทร์ยุคต้น'  WHERE id = 'fig-s-01';
UPDATE figures SET era = 'รัตนโกสินทร์ยุคต้น'  WHERE id = 'fig-s-02';
UPDATE figures SET era = 'รัตนโกสินทร์ยุคต้น'  WHERE id = 'fig-a-01';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-b-04';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-c-01';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-c-02';
UPDATE figures SET era = 'รัตนโกสินทร์ (ร.5)'   WHERE id = 'fig-s-03';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-b-01';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-c-09';
UPDATE figures SET era = 'รัตนโกสินทร์ (ร.6)'   WHERE id = 'fig-s-04';
UPDATE figures SET era = 'ยุคประชาธิปไตย'         WHERE id = 'fig-a-03';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-c-05';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-s-14';
UPDATE figures SET era = 'รัตนโกสินทร์ยุคใหม่'  WHERE id = 'fig-b-06';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-c-08';
UPDATE figures SET era = 'ยุคประชาธิปไตย'         WHERE id = 'fig-a-06';
UPDATE figures SET era = 'ยุคสมัยใหม่'            WHERE id = 'fig-b-16';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-c-04';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-b-18';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-c-13';
UPDATE figures SET era = 'อยุธยาตอนปลาย'         WHERE id = 'fig-b-07';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-c-07';
UPDATE figures SET era = 'รัตนโกสินทร์'          WHERE id = 'fig-c-16';
UPDATE figures SET era = 'อยุธยา–รัตนโกสินทร์'  WHERE id = 'fig-c-06';
UPDATE figures SET era = 'อยุธยาตอนปลาย'         WHERE id = 'fig-s-10';
UPDATE figures SET era = 'อยุธยาตอนกลาง'         WHERE id = 'fig-s-09';
