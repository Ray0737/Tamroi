# ตามรอย (Tamroi)
### แอปพลิเคชันเพื่อการให้ความรู้ทางประวัติศาสตร์ผ่านเกมแผนที่แบบเปิดโลก
**"Tamroi" — Historical Gamification Application via Open-World Map Game**

โครงการรหัส **28P22C00857** เสนอต่อสำนักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม ภายใต้การแข่งขันพัฒนาโปรแกรมคอมพิวเตอร์แห่งประเทศไทย ครั้งที่ 28 (NSC 2026)

**ผู้พัฒนา:** นาย รพี รัตนมนูญพร · นางสาว รชยา เชวงกิจวณิช · นาย ปภาวิชญ์ แซ่หลิ่ว
**อาจารย์ที่ปรึกษา:** อาจารย์ธนภูมิ เรืองไพศาล
**สถาบัน:** โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร (ฝ่ายมัธยม)

---

## Table of Contents

1. [Acknowledgement](#acknowledgement)
2. [Abstract (TH/EN)](#abstract-then)
3. [Introduction](#introduction)
4. [Syllabus](#syllabus)
   - [Purpose](#purpose)
   - [Target Group & Project Scope](#target-group--project-scope)
   - [System Workflow (Player Flow)](#system-workflow-player-flow)
   - [UI Examples](#ui-examples)
   - [Related Theories](#related-theories)
   - [Lore System](#lore-system)
   - [Motivation System](#motivation-system)
5. [Features Overview](#features-overview)
6. [Flowchart Diagrams](#flowchart-diagrams)
7. [Story Board (Game Mechanics)](#story-board-game-mechanics)
   - [Field Exploration](#field-exploration)
   - [Capture Loop](#capture-loop)
   - [Co-op Mode (Phase 1.5)](#co-op-mode-phase-15)
8. [Tech Stack](#tech-stack)
9. [Software Specifications](#software-specifications)
10. [Source Code (GitHub)](#source-code-github)
11. [Software Limitations](#software-limitations)
12. [Device & Platform Requirements](#device--platform-requirements)
13. [User Audience](#user-audience)
14. [Post-Platform Testing](#post-platform-testing)
   - [Methodology](#methodology)
   - [Suggested Additional Measurements](#suggested-additional-measurements)
   - [Results](#results)
15. [Problems & Obstacles](#problems--obstacles)
16. [Development Phases](#development-phases)
17. [Summary & Recommendations](#summary--recommendations)
18. [References](#references)
19. [Developer Contacts & Bio](#developer-contacts--bio)
20. [Appendix](#appendix)

---

## Acknowledgement

ทีมผู้พัฒนาโครงการ "ตามรอย" ขอขอบพระคุณผู้สนับสนุนทุกฝ่ายที่ทำให้โครงการนี้สำเร็จลุล่วง โดยเฉพาะการแข่งขันพัฒนาโปรแกรมคอมพิวเตอร์แห่งประเทศไทยครั้งที่ 28 (NSC) ที่เปิดโอกาสให้ทีมได้เข้าร่วมแข่งขันและพัฒนาผลงาน

ขอขอบคุณโรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร (ฝ่ายมัธยม) และอาจารย์ธนภูมิ เรืองไพศาล สำหรับคำปรึกษาด้านการพัฒนาโปรแกรมและเอกสารประกอบการแข่งขัน ซึ่งเป็นแรงผลักดันสำคัญที่ทำให้โครงงานนี้สำเร็จ

**คณะผู้พัฒนา:** นาย รพี รัตนมนูญพร, นางสาว รชยา เชวงกิจวณิช, นาย ปภาวิชญ์ แซ่หลิ่ว

---

## Abstract (TH/EN)

### บทคัดย่อ

"ตามรอย" เป็นโครงงานซอฟต์แวร์ประเภทโปรแกรมเพื่อการศึกษา ในรูปแบบเว็บแอปพลิเคชันที่ส่งเสริมการเรียนรู้ประวัติศาสตร์ไทยผ่านการสำรวจสถานที่จริง โดยนำกลไกและองค์ประกอบของการออกแบบเกม (Gamification) มาประยุกต์ใช้ เพื่อแก้ปัญหาการขาดแรงจูงใจในการเรียนประวัติศาสตร์ของเยาวชนและบุคคลทั่วไป ผ่านกระบวนการเรียนรู้เชิงประสบการณ์ (Experiential Learning) ที่เชื่อมโยงพื้นที่จริงกับองค์ความรู้ทางประวัติศาสตร์

แอปพลิเคชันออกแบบตามหลักการเรียนรู้เชิงสถานการณ์ (Situated Learning) ซึ่งเชื่อว่าการเรียนรู้มีประสิทธิผลสูงสุดเมื่อเกิดในบริบทจริง ผู้ใช้เริ่มต้นด้วยแผนที่ประเทศไทยที่ถูกปกคลุมด้วยระบบเปิดเผยข้อมูลตามการสำรวจ (Map Visibility Fog) ซึ่งจะจางหายเมื่อผู้ใช้เดินทางไปยังพื้นที่จริงและผ่านแบบทดสอบความรู้ที่ผูกกับพื้นที่นั้น กระบวนการนี้กระตุ้นการเรียนรู้เชิงรุก (Active Learning) เพราะผู้เรียนต้องมีส่วนร่วมทั้งทางกาย (การเดินทาง) และทางปัญญา (การตอบคำถามเนื้อหาประวัติศาสตร์)

**คำสำคัญ:** การเรียนรู้ประวัติศาสตร์, การใช้กลไกเกมในการเรียนรู้, การเรียนรู้ตามบริบท, การเรียนรู้เชิงรุก, แผนที่เชิงโต้ตอบ, ระบบเปิดเผยข้อมูลตามการสำรวจ, ประวัติศาสตร์ไทย, บุคคลสำคัญทางประวัติศาสตร์

### Abstract

"Tamroi" (ตามรอย, "Trace the Footsteps") is an educational software project delivered as a web application that supports Thai history learning through real-world location exploration. It applies game-based design mechanics (Gamification) to address the lack of motivation for studying Thai history among youth and the general public, through an Experiential Learning process that connects real locations with historical knowledge.

The application is built on Situated Learning principles, which hold that learning is most effective in authentic contexts. Users start with a map of Thailand covered by a Map Visibility Fog system that clears as they physically travel to real locations and pass history assessments tied to those areas — promoting Active Learning, since learners must engage both physically (travel) and cognitively (answering historical content questions).

**Keywords:** Thai History Learning, Game-Based Learning Mechanisms, Situated Learning, Active Learning, Interactive Map, Map Visibility Fog System, Thai History, Historical Figures

---

## Introduction

ผลการทดสอบ O-NET ชั้นมัธยมศึกษาปีที่ 6 ปีการศึกษา 2566 ของสถาบันทดสอบทางการศึกษาแห่งชาติ (สทศ.) ชี้ว่าสาระที่ 4: ประวัติศาสตร์ มีคะแนนเฉลี่ยระดับชาติต่ำที่สุดในกลุ่มสาระสังคมศึกษา ศาสนา และวัฒนธรรม อยู่ในช่วงเพียง 23–24% [1] สาเหตุหลักมาจาก 3 ด้าน คือ (1) รูปแบบการสอนที่เน้นท่องจำชื่อ วันที่ และเหตุการณ์ โดยขาดการเชื่อมโยงกับสถานที่และบริบทจริง [1] (2) เนื้อหาเชิงนามธรรมที่ไม่เกี่ยวข้องกับประสบการณ์ตรงของผู้เรียน ทำให้ขาดแรงจูงใจภายใน (Intrinsic Motivation) [2][3] และ (3) การวัดผลที่เน้นความจำระยะสั้นเพื่อการสอบ ซึ่งไม่ก่อให้เกิดการคงอยู่ของความรู้ (Knowledge Retention) ในระยะยาว [4]

ในทางทฤษฎี Lave & Wenger (1991) [5] เสนอกรอบ Situated Learning ว่าการเรียนรู้ที่มีความหมายต้องเกิด "ในบริบท" ที่ความรู้นั้นถูกใช้จริง ผนวกกับวงจรการเรียนรู้จากประสบการณ์ (Experiential Learning Cycle) ของ Kolb (1984) [6] ที่อธิบายกระบวนการ "ประสบการณ์ตรง → สังเกตและสะท้อน → สร้างความเข้าใจ → ลงมือปฏิบัติ" และ Deterding et al. (2011) [7] ที่ชี้ว่า Gamification ช่วยเพิ่มการมีส่วนร่วมและแรงจูงใจในการเรียนรู้ได้อย่างมีนัยสำคัญ โดยเฉพาะในกลุ่มเยาวชนที่คุ้นเคยกับสื่อดิจิทัล

จากข้อมูลและทฤษฎีดังกล่าว ทีมผู้พัฒนาจึงสร้าง "ตามรอย" ขึ้นเป็นเครื่องมือทางการศึกษาที่ใช้เทคโนโลยีเว็บและภูมิสารสนเทศ (Geospatial Technology) เพื่อให้ผู้เรียน "ตามรอย" บุคคลสำคัญในประวัติศาสตร์ไทยผ่านการเดินทางไปยังพื้นที่จริง โครงการนี้ยังสอดคล้องกับเป้าหมายการพัฒนาที่ยั่งยืน (SDGs) ขององค์การสหประชาชาติ โดยเฉพาะ SDG 4 (Quality Education) เป้าหมายย่อย 4.7 ด้านมรดกทางวัฒนธรรม และ SDG 11 (Sustainable Cities and Communities) เป้าหมายย่อย 11.4 ด้านการอนุรักษ์มรดกทางประวัติศาสตร์และวัฒนธรรม

---

## Syllabus

### Purpose

1. พัฒนาเว็บแอปพลิเคชันเพื่อการเรียนรู้ประวัติศาสตร์ไทย ที่ผสานกลไก Gamification กับเทคโนโลยีระบุตำแหน่งทางภูมิศาสตร์ (Geolocation) เพื่อสร้างประสบการณ์เรียนรู้แบบโต้ตอบ
2. ส่งเสริมการเรียนรู้ประวัติศาสตร์ไทยผ่าน Experiential Learning และ Situated Learning โดยเชื่อมความรู้กับสถานที่จริง
3. เพิ่มแรงจูงใจและการมีส่วนร่วม (Engagement) ของผู้เรียน ผ่านการสำรวจ การทำภารกิจ และการสะสมความรู้ในรูปแบบเกม
4. สร้างสื่อการเรียนรู้ดิจิทัลที่ใช้เป็นแหล่งเรียนรู้นอกห้องเรียนสำหรับนักเรียน ครู และบุคคลทั่วไป

### Target Group & Project Scope

เว็บแอปพลิเคชัน "ตามรอย" แบ่งการทำงานเป็น 2 ส่วนหลัก:

- **ส่วนที่ 1 — ระบบแผนที่และการสำรวจภาคสนาม (Field Exploration System):** กระตุ้นให้ผู้ใช้เดินทางไปยังสถานที่จริง ผ่านระบบเปิดเผยข้อมูลตามการสำรวจ (Map Visibility Fog) ที่ค่อย ๆ ปลดล็อกข้อมูลประวัติศาสตร์บนแผนที่เชิงโต้ตอบ
- **ส่วนที่ 2 — ระบบเนื้อหาประวัติศาสตร์และการประเมินผล (Historical Content & Learning Assessment):** ประกอบด้วยแบบทดสอบ (Quiz) คลังข้อมูล (Archive) สำหรับเก็บบุคคลสำคัญที่สะสมได้ และแผงแสดงความก้าวหน้า (Profile Dashboard)

เนื้อหาทั้งหมดในระบบอ้างอิงตามตัวชี้วัดและสาระการเรียนรู้แกนกลาง กลุ่มสาระสังคมศึกษา ศาสนา และวัฒนธรรม สาระที่ 4: ประวัติศาสตร์ ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560) ของ สพฐ. [2] โดยครอบคลุมตัวชี้วัดระดับ ม.4–6 เป็นหลัก เพื่อให้ใช้งานเป็นสื่อเสริมนอกห้องเรียนได้อย่างมีประสิทธิผล

### System Workflow (Player Flow)

ผู้ใช้สามารถเริ่มเดินทางไปยังเขตใดก็ได้ทั่วประเทศไทย ตามขั้นตอนดังนี้:

1. **เดินทางไปยังจุดสังเกตการณ์ (Watchtower):** สถานที่สำคัญหลักของแต่ละเขต เช่น วัด อนุสาวรีย์ หรือสถานที่ประวัติศาสตร์ เมื่อเช็คอินสำเร็จ ระบบจะเปิดเผยพื้นที่ประมาณ 1 ตร.กม. ออกจาก Fog of War ทีละพื้นที่ย่อย (ไม่เปิดทั้งจังหวัดในครั้งเดียว) เพื่อกระตุ้นการสำรวจต่อเนื่อง พร้อมแสดงบุคคลในตำนาน (Legendary Figure) ที่ยังถูกล็อกไว้ (Phase-Locked)
2. **เยี่ยมชมจุดสนับสนุน (Support Nodes):** สถานที่ย่อยอย่างร้านกาแฟท้องถิ่น ร้าน OTOP หรือสถานที่ทางประวัติศาสตร์รอง ที่ต้องเยี่ยมชมก่อนพบบุคคลสำคัญ
   - **บุคคลระดับ C:** จับ (Capture) ได้ทันทีระหว่างสำรวจ
   - **บุคคลระดับ B:** จับได้หลังผ่านแบบทดสอบ (Quiz)
   - **บุคคลระดับ S/A (ถูกล็อกไว้):** ต้องเยี่ยมชม Support Nodes ครบก่อน ได้แก่ ร้านกาแฟ 2 แห่ง ร้าน OTOP/Workshop 1 แห่ง และสถานที่รอง 3 แห่ง
3. **สะสมคะแนนและปลดล็อก Lore:** Legacy Score เพิ่มขึ้นบน Leaderboard และ Map Discovery % เพิ่มขึ้นเมื่อเช็คอินครบจุดตรวจสอบ เรื่องราวเชิงลึกของบุคคล/สถานที่จะปลดล็อกใน Archive
4. **ตัวอย่าง — เหตุการณ์ 14 ตุลาคม 2516:** เช็คอินครบ 3 จุด (อนุสาวรีย์ประชาธิปไตย, มหาวิทยาลัยธรรมศาสตร์, ถนนราชดำเนิน) จะปลดล็อก Lore ของเหตุการณ์นั้น ผู้เรียนได้อ่านเรื่องราวขณะยืนอยู่ ณ สถานที่จริง สร้างประสบการณ์ "สัมผัส" ประวัติศาสตร์ มากกว่าเพียง "รู้" ประวัติศาสตร์

### UI Examples

ระบบเป็นเว็บแอปพลิเคชันที่ใช้งานผ่านเบราว์เซอร์บนแท็บเล็ตและมือถือ หน้าจอหลักประกอบด้วย:

| หน้าจอ | รายละเอียด |
|---|---|
| Login / Sign-in | เข้าสู่ระบบด้วย Google OAuth 2.0 หรืออีเมล/รหัสผ่าน จากนั้นขอสิทธิ์ Location Service |
| Initial Setting & Onboarding | เปิดสิทธิ์ระบุตำแหน่งและเลือกเขตบ้านเกิด |
| Main Map | แผนที่ประเทศไทยปกคลุมด้วย Map Visibility Fog สีเข้ม จางหายทีละเขตตามการเช็คอินจริง พร้อมแสดง Map Discovery % |
| Mission / Outpost & Capture | ตรวจสอบ GPS ผ่าน HTML5 Geolocation API [10] เปิดภารกิจจับบุคคลสำคัญที่ผูกกับพื้นที่ เช่น สมเด็จพระนเรศวรมหาราชที่อยุธยา (S-Tier) |
| Watchtower | แสดงชีวประวัติย่อและบริบทของบุคคลสำคัญ แยกสถานะ "ค้นพบแล้ว" กับ "ยังไม่ค้นพบ" |
| Archive / Collections | รวมบุคคลสำคัญตามระดับความหายาก (S/A/B/C) พร้อม Lore ที่ปลดล็อกแล้ว |
| Leaderboard | อันดับ Legacy Score, Map Discovery % และจำนวนการสะสม แบบ Realtime |
| Notification & Settings | แจ้งเตือนจุดสนับสนุนใหม่/อันดับเปลี่ยนแปลง และจัดการบัญชี |

*(ภาพหน้าจอประกอบ — รูปที่ 1–17 อยู่ในเอกสารต้นฉบับฉบับสมบูรณ์)*

### Related Theories

- **Situated Learning (Lave & Wenger, 1991 [5]):** การเรียนรู้ที่มีความหมายต้องเกิด "ในบริบท" ที่ความรู้ถูกใช้จริง — ผู้เรียนเดินทางไปยังพื้นที่จริงแทนการอ่านจากตำรา "ตามรอย" ต่างจากเกมสำรวจตำแหน่งทั่วไป (เช่น Pokémon GO) ตรงที่ทุกสถานที่ผูกกับบุคคลและเหตุการณ์จริง ไม่ใช่เพียงจุดสุ่มพบตัวละครสมมติ
- **Experiential Learning Cycle (Kolb, 1984 [6]):** "ตามรอย" รองรับครบ 4 ขั้น — ประสบการณ์ตรง (เช็คอิน) → สังเกตและสะท้อน (อ่าน Lore) → สร้างความเข้าใจ (ทำ Quiz) → ลงมือทดลอง (Capture และสำรวจต่อ)
- **Gamification (Deterding et al., 2011 [7]):** "การนำองค์ประกอบของการออกแบบเกมมาประยุกต์ใช้ในบริบทที่ไม่ใช่เกม" ระบบใช้ 5 กลไกหลัก: การสะสมและรางวัล (Collection/Reward), การสำรวจและค้นพบ, เรื่องเล่าทางประวัติศาสตร์, ระบบ Lore, และการแข่งขันทางสังคม (Leaderboard)
- **Bloom's Revised Taxonomy (Anderson & Krathwohl, 2001 [4]):** ใช้กำกับระดับคำถามใน Quiz (ดู [Lore System](#lore-system))
- **Self-Determination Theory (Deci & Ryan, 1985 [2][3]):** อธิบายว่าทำไมต้องมีกลไกรักษาแรงจูงใจระยะยาว (ดู [Motivation System](#motivation-system))

### Lore System

ระบบเรื่องราวเชิงลึก (Lore System) เป็นแกนกลางของคุณค่าทางการศึกษาของโครงการ และเป็นจุดต่างที่ชัดเจนจากเกมสำรวจตำแหน่งทั่วไปที่ไม่มีความรู้เชิงลึกผูกกับสถานที่จริง

- **เกณฑ์การจัดระดับบุคคลสำคัญ (Tier Classification):** ใช้ "ระดับผลกระทบทางประวัติศาสตร์" (Historical Impact Criteria) [8][9] ประเมิน 3 มิติ — ขอบเขตผลกระทบ, ความยั่งยืนของผลกระทบ, และหลักฐานทางประวัติศาสตร์ แบ่งเป็น S/A/B/C-Tier (ตัวอย่าง S-Tier: สมเด็จพระนเรศวรมหาราช)
- **กระบวนการตรวจสอบเนื้อหา:** (1) รวบรวมจากแหล่งอ้างอิงหลัก เช่น กรมศิลปากร [17] และหลักสูตร สพฐ. [18] (2) ตรวจสอบข้ามแหล่งอย่างน้อย 2 แหล่งก่อนนำเข้าระบบ (3) ผ่านการกำกับดูแลของอาจารย์ที่ปรึกษาก่อน Publish
- **Quiz ออกแบบตาม Bloom's Taxonomy [4]:** บุคคลระดับ C ใช้คำถามระดับ Remember ส่วนระดับ S/A ใช้คำถามระดับ Understand ที่ต้องอธิบายความสัมพันธ์ระหว่างบุคคล เหตุการณ์ และสถานที่
- **Learning-First Design:** "Lore ก่อน Capture เสมอ" — ผู้ใช้ต้องอ่าน Lore และเยี่ยมชม Support Nodes ก่อนจับบุคคลระดับ S/A ทำให้การจับเป็นผลลัพธ์ของการเรียนรู้ ไม่ใช่จุดมุ่งหมายหลัก
- **นโยบาย AI ในการร่างเนื้อหา:** AI ทำหน้าที่เป็น "ผู้ช่วยร่าง" เท่านั้น (ร่าง Lore เบื้องต้น, สร้างคำถาม Quiz เบื้องต้น, แปล/ปรับโทนภาษา) — **ห้าม** ใช้เป็นแหล่งข้อมูลหลัก, ห้ามตัดสินระดับ Tier, และห้ามข้าม Expert Review ทุก Prompt ถูกจำกัดขอบเขตเฉพาะประวัติศาสตร์ไทยที่มีหลักฐานรองรับ พร้อมบันทึก Prompt Log และฟิลด์ `source_ref` บังคับในทุกระเบียนของ `lore_nodes` และ `quiz_questions`

### Motivation System

แม้ Gamification จะสร้างแรงจูงใจได้ดีในระยะสั้น แต่ Deci & Ryan (1985) [2][3] ชี้ว่าแรงจูงใจจะลดลงเมื่อผู้ใช้บรรลุเป้าหมาย (เช่น สะสม S-Tier ครบ) ทีมผู้พัฒนาจึงออกแบบกลไกรักษาแรงจูงใจระยะยาว 3 ส่วน:

1. **เนื้อหาตามบริบทและวันสำคัญ (Seasonal Content):** ปรับโฟกัสเนื้อหาตามช่วงเวลา เช่น วันที่ 14 ตุลาคม ปลดล็อก Lore เฉพาะของเหตุการณ์ 14 ตุลา 2516 หรือ Double Points สำหรับบุคคลด้านความสัมพันธ์ระหว่างประเทศในปีที่ไทยเป็นประธาน ASEAN — สร้าง Urgency ตามที่ Deterding et al. (2011) [7] ระบุ
2. **การแข่งขันระยะสั้น (Leaderboard Seasons):** รีเซ็ตอันดับทุก 3 เดือน ผู้ติด Top 3 ได้รับ Historical Badge ถาวร
3. **ภารกิจชุมชน (Collaborative Missions):** ต้องการผู้เล่นหลายคน Check-in จุดเดียวกันในเวลาที่กำหนด สร้าง Social Engagement ตามหลัก Situated Learning ของ Lave & Wenger [5] ที่เน้นการเรียนรู้ร่วมกันในบริบทจริง — ฟีเจอร์นี้ขยายเป็นระบบ Co-op เต็มรูปแบบใน Phase 1.5 (ดู [Development Phases](#development-phases))

---

## Features Overview

### Phase 1 — Core Features (Web MVP)

| ฟีเจอร์ | รายละเอียดย่อ |
|---|---|
| Fog of War Map | ปกคลุมแผนที่ประเทศไทยจนกว่าจะเช็คอินจริง เปิดเผยทีละ ~1 ตร.กม. |
| GPS Check-in / Watchtower | ยืนยันตำแหน่งด้วย HTML5 Geolocation API [10] + Polygon Matching กับ GeoJSON 77 จังหวัด |
| Support Nodes | ร้านกาแฟ / OTOP / สถานที่รอง ที่ต้องเยี่ยมชมก่อนปลดล็อกบุคคลระดับ S/A |
| Quiz & Capture Loop | ตอบคำถามถูกต้อง → ได้การ์ดบุคคลสำคัญ + Legacy Score อัตโนมัติ |
| Historical Figure Archive | สะสมบุคคลสำคัญแบ่งตามระดับความหายาก S/A/B/C-Tier [8][9] |
| Lore System | เรื่องราวเชิงลึกที่ผูกกับพิกัดจริง ปลดล็อกเมื่อเช็คอินครบจุดตรวจสอบ |
| Realtime Leaderboard | จัดอันดับ Legacy Score / Map Discovery % / Archive Count แบบเรียลไทม์ผ่าน Supabase Realtime |
| Seasonal Motivation | Legacy Bonus ตามวันสำคัญทางประวัติศาสตร์ และ Leaderboard Season รีเซ็ตทุก 3 เดือน |
| Notifications & Settings | แจ้งเตือน Outpost ใหม่ / อันดับเปลี่ยน พร้อมจัดการบัญชีและความเป็นส่วนตัว |
| Auth & PDPA Compliance | Google OAuth 2.0 / Email-Password ผ่าน Supabase Auth สอดคล้อง PDPA 2562 [15] |

### Phase 1.5 — Co-Op & Community Features (✅ พัฒนาแล้ว + 🔜 กำลังวางแผน)

| ฟีเจอร์ | สถานะ | รายละเอียดย่อ |
|---|---|---|
| Guild / Party System | ✅ Completed | สร้าง-เข้าร่วมกลุ่มผ่าน Invite Code 6 หลัก, Shared Fog of War, Guild Leaderboard, Supabase Presence |
| Collaborative Missions | ✅ Completed | ภารกิจที่ต้องการผู้เล่นหลายคน Check-in จุดเดียวกันในเวลาที่กำหนด แจก Lore/Legacy Points อัตโนมัติเมื่อถึงเกณฑ์ |
| Raid Encounters | ✅ Completed | บุคคล S-Tier พิเศษ (`raid_only`) ต้องเล่นหลายคนตอบคำถามแบบ Synchronous ผ่าน Supabase Broadcast |
| Historical Discussion Threads | ✅ Completed | กระทู้ถาม-ตอบ 1 ระดับในหน้า Archive พร้อม Flag System ซ่อนโพสต์อัตโนมัติเมื่อถูกรายงาน 3 ครั้ง |
| District Leaderboards | ✅ Completed | ส่วนหนึ่งของ Guild Leaderboard — จัดอันดับแยกตามเขต/กลุ่ม |
| Trading System | 🔜 Planned | แลกเปลี่ยน Artifact/ไอเทมท้องถิ่นระหว่างผู้เล่น — ดูรายละเอียดที่ [Development Phases](#development-phases) |

### Roadmap Features (วางแผนในระยะถัดไป)

ดูรายละเอียดเต็มรูปแบบที่ [Development Phases](#development-phases): Native Mobile App + AR Capture (Phase 2), Seasonal Live-Service Content (Phase 4), Business & Media Ecosystem Partnerships (Phase 5)

---

## Flowchart Diagrams

แผนภาพแสดงโครงร่างการทำงานของระบบ ประกอบด้วย 5 แผนภาพหลัก ดังนี้

### แผนภาพที่ 3.1 — หลักการเล่น (Game Logic)

```
                 *-----------------*
                 |      LOGIN      |
                 *-----------------*
                          |
                          v
                 *-----------------*
                 | GRANT LOCATION  |
                 |    PERMISSION   |
                 *-----------------*
                          |
                          v
                 *-----------------*
                 |  LOAD MAP +     |
                 |  FOG OF WAR     |
                 *-----------------*
                          |
                          v
                 *-----------------*
                 | TRAVEL TO REAL  |
                 |  WATCHTOWER     |
                 *-----------------*
                          |
                  ________|________
                 /                 \
                v                   v
        *---------------*   *----------------*
        | CHECK-IN OK   |   | OUT OF RADIUS  |
        | (<= 500 m)    |   | -> RETRY       |
        *---------------*   *----------------*
                |                    \
                v                     *---- back to TRAVEL
        *-----------------*
        | FOG OF WAR      |
        | CLEARED (~1km^2)|
        *-----------------*
                |
        ________|_________
       /                  \
      v                    v
*-----------*       *----------------*
| FIGURE: C |       | FIGURE: B/S/A  |
| (instant) |       | (locked)       |
*-----------*       *----------------*
      |                    |
      v                    v
*-----------*       *----------------*
| CAPTURE   |       | VISIT SUPPORT  |
*-----------*       | NODES (2/1/3)  |
      |              *----------------*
      |                    |
      |                    v
      |              *----------------*
      |              | QUIZ MODAL     |
      |              *----------------*
      |                /          \
      |               v            v
      |        *-----------*  *-----------*
      |        | CORRECT   |  | WRONG     |
      |        | -> CAPTURE|  | -> RETRY  |
      |        *-----------*  *-----------*
      |               |
       \_______________|
                |
                v
        *-----------------*
        | LEGACY SCORE ++ |
        | (DB TRIGGER)    |
        *-----------------*
                |
                v
        *-----------------*
        | LEADERBOARD     |
        | UPDATE (REALTIME)|
        *-----------------*
```

### แผนภาพที่ 3.2 — กระบวนการปลดล็อกระบบเรื่องราวเชิงลึก (Lore Unlock Flow)

```
   *------------------*        *------------------*        *------------------*
   | CHECKPOINT A     | -----> | CHECKPOINT B     | -----> | CHECKPOINT C     |
   | e.g. Democracy   |        | e.g. Thammasat   |        | e.g. Ratchadamnoen|
   | Monument         |        | University       |        | Road             |
   *------------------*        *------------------*        *------------------*
            \                          |                          /
             \                         |                         /
              \                        v                        /
               *------------------------------------------------*
               |     ALL CHECKPOINTS VISITED? (chain_id match)   |
               *------------------------------------------------*
                              |                  \
                          yes |                   | no
                              v                    v
               *-----------------------*   *-------------------*
               | UNLOCK LORE NODE      |   | STAY LOCKED        |
               | (review_status =      |   | -> keep exploring  |
               |  'approved')          |   *-------------------*
               *-----------------------*
                              |
                              v
               *-----------------------*
               | SAVE TO user_lore     |
               | + show in ARCHIVE     |
               *-----------------------*
                              |
                              v
               *-----------------------*
               | + lore_pts -> LEGACY  |
               |   SCORE                |
               *-----------------------*
```

### แผนภาพที่ 3.3 — สถาปัตยกรรมระบบและโครงสร้าง Runtime

```
   *==========================================================*
   |              PRESENTATION LAYER (Client)                 |
   |  app.html (Bottom Nav 4 Tabs / Sheets / Offcanvas/ Modal) |
   |  HTML5 + Bootstrap 5.3 + Leaflet.js 1.9.4                |
   *==========================================================*
                              |
                              v
   *==========================================================*
   |          APPLICATION LOGIC LAYER (IIFE Modules)           |
   |  map.js | collection.js | missions.js | leaderboard.js   |
   |  fog-grid.js | utils.js | guild.js | coop.js | raid.js   |
   |  discussion.js                                            |
   *==========================================================*
                              |
                     all calls funnel through
                              v
                 *---------------------------*
                 |  js/supabase-client.js    |
                 |  window.DB.* / .Auth.*    |
                 |  .Coop.* / .Raid.*        |
                 *---------------------------*
                              |
                              v
   *==========================================================*
   |               DATA LAYER (Supabase / PostgreSQL)          |
   |  Auth | Tables + RLS | DB Triggers | Realtime / Broadcast |
   *==========================================================*
                              |
                              v
                 *---------------------------*
                 |   Vercel (Hosting / CDN)  |
                 |   build.js -> inject ENV  |
                 *---------------------------*
```

### แผนภาพที่ 3.4 — ขอบเขตการทำงานของโมดูลและชั้นการเข้าถึงฐานข้อมูล

```
   js/map.js ---------\
   js/collection.js ----\
   js/missions.js --------\
   js/leaderboard.js -------*
   js/fog-grid.js ----------*----> js/supabase-client.js ----> Supabase
   js/guild.js --------------*       (sole DB gateway)         (PostgreSQL
   js/coop.js ---------------/       window.DB.* / Auth.*       + RLS)
   js/raid.js ---------------/
   js/discussion.js ---------/

   * No module may call Supabase directly — every read/write
     passes through js/supabase-client.js, which enforces
     Row Level Security (RLS) per table on the server side.
```

### แผนภาพที่ 3.5 — ผังการทำงานหลัก (เช็คอิน → จับบุคคลสำคัญ)

```
  USER            CLIENT (JS)              SUPABASE (Server)
   |                   |                          |
   |--- open app ----->|                          |
   |                   |--- load profile -------->|
   |                   |<-- fog state, score ------|
   |                   |                          |
   |--- travel + ----->|                          |
   |  watchPosition()  |                          |
   |                   |--- polygon match ------->|
   |                   |   (client-side check)     |
   |                   |--- POST check-in -------->|
   |                   |                          |--- validate radius
   |                   |                          |    (Edge Function)
   |                   |<-- fog unlocked ----------|
   |<-- map updates ---|                          |
   |                   |                          |
   |--- visit nodes -->|--- log node visit ------>|
   |--- answer quiz -->|--- submit answer ------->|
   |                   |                          |--- check answer
   |                   |                          |--- INSERT user_captures
   |                   |                          |--- TRIGGER:
   |                   |                          |    update_legacy_score()
   |                   |<-- capture result --------|
   |<-- figure card ---|                          |
   |                   |<== realtime broadcast ===>|
   |<-- leaderboard ---|                          |
   |    refreshed      |                          |
```

---

## Story Board (Game Mechanics)

ระบบเป็นเว็บแอปพลิเคชันที่ใช้งานได้บนเบราว์เซอร์ทั้งแท็บเล็ตและมือถือ แบ่งกลไกหลักออกเป็น 2 ระบบ: ระบบแผนที่และการสำรวจภาคสนาม และระบบการจับและการสะสมความรู้

### Field Exploration

1. ผู้ใช้เข้าสู่ระบบผ่าน Google Account หรืออีเมล ระบบขอสิทธิ์ Location Service สำหรับการเช็คอิน
2. ระบบโหลดแผนที่ด้วย **Leaflet.js 1.9.4** [14] เป็น Rendering Engine ดึง Map Tiles จาก **CartoDB Dark Matter** ร่วมกับขอบเขต GeoJSON ของ 77 จังหวัด
3. แผนที่แสดงผลแบบ Fog of War — พื้นที่ที่ยังไม่เช็คอินจะถูกปกคลุมไว้
4. **HTML5 Geolocation API** [10] ติดตามพิกัด GPS แบบ Real-time ผ่าน `watchPosition()` เมื่อพิกัดตรงกับเขตใด ระบบจับคู่รูปหลายเหลี่ยม (Polygon Matching) กับ GeoJSON แล้วลบ Fog of War ของเขตนั้น
5. บุคคลสำคัญในพื้นที่ปรากฏบนแผนที่ — หากถูกล็อกไว้ ต้องเยี่ยมชม Support Nodes ให้ครบก่อนจึงจับได้

### Capture Loop

1. เมื่อเยี่ยมชม Support Nodes ครบเงื่อนไข ระบบเปิด Quiz Modal
2. ตอบคำถามถูกต้อง → ได้รับ Historical Figure Card และ Legacy Score เพิ่มอัตโนมัติผ่าน Database Trigger ของ Supabase
3. การ์ดบุคคลสำคัญถูกเก็บใน Archive พร้อมชีวประวัติย่อ เมื่อเช็คอินจุดตรวจสอบครบ Lore ของบุคคลนั้นจะปลดล็อก
4. ผู้ใช้กลับมาทบทวนเนื้อหาหรือสำรวจพื้นที่ใหม่เพื่อสะสมคะแนนบน Leaderboard ต่อเนื่อง

### Co-op Mode (Phase 1.5)

กลไกเสริมที่เปลี่ยนการสำรวจแบบเดี่ยวให้กลายเป็นประสบการณ์แบบทีม ส่งมอบผ่าน `supabase/patch_coop.sql` โดยไม่แก้ไขสถาปัตยกรรม Phase 1 เดิม:

1. **สร้าง/เข้าร่วม Guild:** ผู้เล่นสร้างกลุ่มได้สูงสุด `max_members` คน (ค่าเริ่มต้น 6) ระบบสร้าง Invite Code 6 หลักอัตโนมัติผ่าน Trigger `on_guild_insert_code` สมาชิกใหม่เข้าร่วมโดยกรอกโค้ดนี้ — สถานะออนไลน์ของสมาชิกแสดงผ่าน **Supabase Presence** และอันดับกลุ่มคำนวณจาก VIEW `guild_leaderboard` แบบเรียลไทม์
2. **ภารกิจร่วม (Collaborative Missions):** เลือกภารกิจจาก `collab_missions` ที่ระบุจำนวนผู้เล่นขั้นต่ำ (`required_players`) และกรอบเวลา (`time_window_hours`) สมาชิกแต่ละคนเช็คอินจุดเดียวกันแล้วบันทึกลง `collab_mission_checkins` เมื่อยอดถึงเกณฑ์ภายในเวลาที่กำหนด Trigger `on_collab_checkin_threshold` จะโอน `reward_lore_id` และ `reward_pts` ให้สมาชิกทุกคนอัตโนมัติ และบันทึกผลสำเร็จลง `collab_mission_completions`
3. **Raid Encounters:** บุคคลระดับตำนานที่มีค่า `raid_only = true` (ต้องผู้เล่นอย่างน้อย `raid_min_players` คน) จะเปิด `raid_sessions` ให้หัวหน้า (Host) เป็นผู้เริ่ม สมาชิกกด Ready ใน `raid_session_members` ทุกคนต้องตอบคำถามขั้นสูง (`is_raid_question = true`, ระดับ Understand/Apply ของ Bloom's Taxonomy [4]) แบบ Synchronous ผ่าน Supabase Broadcast Channel `broadcast:raid:{session_id}` สถานะ Session ไหลจาก `waiting → active → completed/failed` และรองรับ **Host Failover** หากผู้เริ่มหลุดการเชื่อมต่อกลางคัน
4. **กระดานสนทนาเชิงประวัติศาสตร์:** ผู้เล่นแสดงความเห็นเกี่ยวกับบุคคลสำคัญแต่ละคนในหน้า Archive ผ่าน `figure_discussions` (รองรับการตอบกลับ 1 ระดับด้วย `parent_id` self-reference) หากโพสต์ใดถูกรายงานครบ 3 ครั้งใน `discussion_flags` Trigger `on_discussion_flag_count` จะซ่อนโพสต์นั้นโดยอัตโนมัติ

---

## Tech Stack

| ชั้น (Layer) | เทคโนโลยี |
|---|---|
| Frontend | HTML5, **Bootstrap 5.3** [11] (Mobile-First CSS Framework + Component Library), Vanilla JavaScript ES6+ Modules (ไม่มีขั้นตอน Build/Compile) |
| Map / Design System | **Leaflet.js 1.9.4** [14] (Map Rendering Engine), CSS Custom Properties เป็น Design Tokens |
| Backend / Database | **Supabase (PostgreSQL)** [12] — Backend-as-a-Service แบบ Open Source: Database, Authentication (Email/Password + Google OAuth 2.0), Database Triggers, Realtime Subscriptions |
| Hosting / Deployment | **Vercel** [13] — เชื่อมต่อ GitHub โดยตรง, Auto-deploy ทุก push, CDN ทั่วโลก, `build.js` สำหรับ Inject Environment Variables, Security Headers ใน `vercel.json` |
| Coding Language & Libraries | HTML5, JavaScript ES6+ Modules, Bootstrap 5.3, Leaflet.js 1.9.4 [14], Supabase JS Client v2 |
| Hardware / Tools | คอมพิวเตอร์/แล็ปท็อปสำหรับพัฒนา, มือถือสำหรับทดสอบ |
| IDE | **VS Code** พร้อม Extension จัดฟอร์แมตและ Syntax Highlighting |
| Version Control | **Git + GitHub** |
| Graphic Tools | **Figma** สำหรับออกแบบ UI/UX |
| Testing | **Static Regression Test Suite** — Zero-Dependency, Node.js ES Modules ใน `tests/` (7 ไฟล์: `lore-static`, `remaining-static`, `prod-readiness-static`, `district-seed-static`, `env-policy-static`, `grid-fog-static`, `coop-static`) รันด้วย `node tests/run-static.mjs` |

---

## Software Specifications

### Input Specification

- พิกัด GPS (ละติจูด/ลองจิจูด) จาก HTML5 Geolocation API [10] ผ่าน `watchPosition()`
- ข้อมูลยืนยันตัวตน: Google Account Token หรืออีเมล/รหัสผ่านผ่าน Supabase Auth
- คำตอบแบบทดสอบ (Multiple Choice)
- การตั้งค่าผู้ใช้: การแสดงผลแผนที่, ภาษา, การแจ้งเตือน

### Output Specification

- การปลดล็อก Map Visibility Fog ของเขตที่เช็คอินแล้ว
- การ์ดบุคคลสำคัญพร้อมชีวประวัติย่อ ระดับความหายาก และ Legacy Value
- Legacy Score ที่อัปเดตอัตโนมัติผ่าน Database Trigger
- Leaderboard Ranking แบบ Realtime
- เนื้อหา Lore ที่ปลดล็อกใน Archive
- การแจ้งเตือน (Outpost ใหม่ / อันดับเปลี่ยน)

### Functional Specification

Authentication (Google OAuth/Email ผ่าน Supabase Auth) → GPS Check-in (Polygon Matching กับ 77 จังหวัด) → Fog of War Toggle → Quiz & Capture → Legacy Score Calculation → Lore Unlock → Realtime Leaderboard

### Anti-Spoofing Measures (GPS Spoofing Prevention)

เนื่องจากกลไกหลักของ "ตามรอย" อาศัยพิกัด GPS เป็นเงื่อนไขปลดล็อกเนื้อหา จึงมีความเสี่ยงที่ผู้ใช้จะปลอมพิกัดเพื่อเช็คอินโดยไม่เดินทางจริง ซึ่งขัดกับเป้าหมายหลักของ Situated Learning [5] ระบบจึงออกแบบการป้องกันเป็นชั้น ๆ (Defense in Depth) ดังนี้:

| มาตรการ | สถานะ | หลักการทำงาน |
|---|---|---|
| **Server-side Validation** | ✅ Implemented | ระบบไม่เชื่อพิกัดที่ส่งจาก Client โดยตรง — ทุกคำขอเช็คอินถูกตรวจสอบซ้ำฝั่งเซิร์ฟเวอร์ผ่าน **Supabase Edge Functions (Deno)** ก่อนอัปเดต Fog of War |
| **Row Level Security (RLS)** | ✅ Implemented | ตาราง `user_districts` ไม่อนุญาตให้ Client เขียนค่า `fogged`/`checked_in_at` โดยตรง ต้องผ่าน Edge Function ที่มีสิทธิ์เท่านั้น ป้องกันการยิง API ปลอมข้อมูลเช็คอินตรง ๆ |
| **Tolerance Radius** | ✅ Implemented | กำหนดรัศมีคลาดเคลื่อนที่ยอมรับได้ต่อ Watchtower เพื่อรองรับ GPS Drift ตามธรรมชาติ (~20 ม.) โดยไม่เปิดช่องให้เช็คอินจากระยะไกลเกินจริง |
| **Velocity / Time-Coordinate Check** | 🔜 Planned | ตรวจสอบว่าระยะทางระหว่างพิกัด 2 จุดล่าสุดกับเวลาที่ผ่านไป สอดคล้องกับความเร็วการเดินทางที่เป็นไปได้จริงหรือไม่ (เช่น หากเปลี่ยนพิกัดข้ามจังหวัดภายในไม่กี่วินาที ระบบจะปฏิเสธคำขอ) |
| **Mock Location Detection** | 🔜 Planned | ตรวจค่า Mock Location Flag จาก HTML5 Geolocation API [10] (เช่น `isFromMockProvider` บน Android) เพื่อปฏิเสธพิกัดที่มาจากแอปปลอม GPS |
| **Photo Verification** | 🔜 Planned | ให้ผู้ใช้ถ่ายภาพ ณ จุดเช็คอินประกอบการยืนยันตัวตนเชิงภาพ สำหรับจุดที่มีความเสี่ยงสูง (เช่น บุคคลระดับ S-Tier) |
| **Rate Limiting** | 🔜 Planned | จำกัดจำนวนครั้งการเช็คอินต่อผู้ใช้ต่อช่วงเวลา เพื่อสกัดการยิง Request อัตโนมัติจากสคริปต์ปลอมพิกัด |

มาตรการที่ Implemented แล้วเพียงพอสำหรับการป้องกันการปลอมแปลงพิกัดแบบพื้นฐาน (Client-side Spoofing Tools ทั่วไป) ส่วนมาตรการที่ Planned จะเสริมความแข็งแกร่งสำหรับการโจมตีที่ซับซ้อนขึ้น (Scripted Bot, Mock GPS App) ก่อนขยายผู้ใช้งานในวงกว้าง — ดูบริบทปัญหาที่พบจริงใน [Problems & Obstacles](#problems--obstacles)

### Software Design

โครงสร้างแอปพลิเคชันแบ่งเป็น 3 ชั้น:

1. **Presentation Layer:** HTML5 + Bootstrap 5.3 + Leaflet.js 1.9.4 — `app.html` เป็น Main Shell (Bottom Navigation 4 Tabs, Bottom Sheets, Offcanvas, Modal); Fog of War และ Markers แสดงผลใน `js/map.js`; Design Tokens ใน `css/variables.css`
2. **Application Logic Layer:** JavaScript Modules แบบ IIFE — `js/map.js` (Fog of War, GPS Matching, Haversine Distance), `js/collection.js` (Archive), `js/missions.js` (Quests), `js/leaderboard.js` (Ranking), `js/fog-grid.js`, `js/utils.js` (`escapeHtml()`); Phase 1.5 เพิ่ม `js/guild.js`, `js/coop.js`, `js/raid.js`, `js/discussion.js` — ทุกโมดูลสื่อสารกับ Supabase ผ่าน `js/supabase-client.js` เพียงไฟล์เดียว
3. **Data Layer:** Supabase (PostgreSQL) — Auth, Storage, Triggers, Realtime; ทุกตารางมี Row Level Security (RLS) แยกข้อมูลต่อผู้ใช้

### Database Schema

**Core Tables:** `profiles` (FK → `auth.users`, Trigger `on_auth_user_created`), `districts` (`polygon_coords` JSONB), `figures` (`class` CHECK S/A/B/C), `artifacts`, `notifications`

**Per-User State Tables:** `user_districts`, `user_captures` (Trigger `on_capture_update_score`), `user_artifacts`, `user_lore`, `user_support_node_visits`, `user_quiz_attempts`

**Lore & Quiz Tables:** `lore_nodes` (`radius_m` + Haversine Distance, `chain_id`/`chain_part`, `review_status`), `quiz_questions` (`difficulty`, 164 คำถามในระบบ), VIEW `leaderboard_legacy`

**Co-op Tables (Phase 1.5):** `guilds` (Trigger `on_guild_insert_code`), `guild_members`, `collab_missions`, `collab_mission_checkins`, `collab_mission_completions` (Trigger `on_collab_checkin_threshold`), `raid_sessions`, `raid_session_members`, `figure_discussions`, `discussion_flags` (Trigger `on_discussion_flag_count`), VIEW `guild_leaderboard`

### Data Protection (PDPA)

สอดคล้องกับพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) [15]: ขอความยินยอมชัดเจนก่อนเก็บข้อมูล, เก็บข้อมูลเท่าที่จำเป็น (ไม่ Background Tracking), เข้ารหัสข้อมูลทั้ง In-Transit (HTTPS/TLS) และ At-Rest ผ่าน Supabase (SOC 2 Type II), และผู้ใช้มีสิทธิ์ดู/แก้ไข/ลบข้อมูลของตน — ระบบรองรับการลบบัญชีภายใน 30 วัน

---

## Source Code (GitHub)

**Repository:** [github.com/Ray0737/NSC_2026](https://github.com/Ray0737/NSC_2026)

```bash
git clone https://github.com/Ray0737/NSC_2026.git
```

รายงานข้อผิดพลาดหรือปัญหาทางเทคนิคผ่าน [GitHub Issues](https://github.com/Ray0737/NSC_2026/issues)

---

## Software Limitations

1. **ขอบเขต:** เว็บแอปพลิเคชันบนเบราว์เซอร์เท่านั้น ยังไม่รองรับ Native App หรือ Offline Mode; ครอบคลุมทั้ง 77 จังหวัดในระดับขอบเขตพื้นที่ แต่เนื้อหาบุคคล/Lore ปัจจุบันครอบคลุมเฉพาะกรุงเทพมหานครและอยุธยา (ขยายเพิ่มในรุ่นถัดไป); รองรับภาษาไทยเป็นหลัก
2. **ความแม่นยำ GPS:** อาจเกิดความผิดพลาดเป็นบางครั้งในรัศมีแคบ (~20 ม.) หรือพื้นที่สัญญาณอับ — มี Tolerance Radius รองรับแล้ว และจะปรับเพิ่มจากการทดสอบภาคสนาม
3. **ความแม่นยำของพิกัด Landmark (Landmark Coordinate Accuracy):** พิกัดของ Watchtower และ Support Nodes ส่วนหนึ่งได้มาจากการ Geocoding ผ่านบริการแผนที่ภายนอก ซึ่งบางครั้งระบบจะ "ปัด" พิกัดไปยังเส้นกึ่งกลางถนน (Road Centerline) ที่ใกล้ที่สุด แทนที่จะเป็นตำแหน่งจริงของทางเข้าอาคารหรือจุดสังเกตการณ์ ทำให้รัศมีเช็คอิน (โดยเฉพาะที่ตั้งค่าแคบ เช่น 500 ม.) อาจไม่ครอบคลุมตำแหน่งที่ผู้ใช้ยืนอยู่จริง ผลกระทบเพิ่มเติมที่เกี่ยวข้อง ได้แก่
   - **สถานที่ขนาดใหญ่/หลายทางเข้า** (เช่น วัดอรุณราชวรารามที่มีพื้นที่กว้างและหลายจุดเข้าออก) พิกัดจุดเดียวไม่สามารถแทนพื้นที่ทั้งหมดได้ดี อาจจำเป็นต้องใช้รูปหลายเหลี่ยม (Polygon) แทนจุด+รัศมีในเวอร์ชันถัดไป
   - **พื้นที่ในร่ม/มีหลังคาคลุม** (เช่น พิพิธภัณฑ์ ตลาดมีหลังคา) สัญญาณ GPS อ่อนลงเป็นพิเศษ ซึ่งเป็นปัญหาคนละประเด็นกับพื้นที่สัญญาณอับทั่วไปที่ระบุไว้ในข้อ 6
   - **แนวทางบรรเทา:** ทีมผู้พัฒนาตรวจสอบพิกัด Watchtower หลักด้วยการเดินสำรวจจริงหรือเทียบกับภาพถ่ายดาวเทียมก่อนนำเข้าระบบ แทนการเชื่อพิกัดจาก Geocoding API เพียงอย่างเดียว แต่ Support Nodes จำนวนมากยังอ้างอิงจากข้อมูล Geocoding เป็นหลักและต้องทยอยตรวจสอบเพิ่มเติม
4. **ขนาดข้อมูล GeoJSON:** ขอบเขต 77 จังหวัดมีขนาดใหญ่ ต้องลดความละเอียดข้อมูล (Data Simplification) เพื่อลดเวลาโหลด
5. **การเชื่อมต่ออินเทอร์เน็ต:** ต้องเชื่อมต่อต่อเนื่องสำหรับ Realtime Subscriptions และ Map Tiles
6. **การใช้พลังงาน:** `watchPosition()` ของ Geolocation API [10] ใช้พลังงานสูงระหว่างสำรวจระยะยาว — มี Throttle (`maximumAge`/`timeout`) แต่ควรเตรียม Power Bank สำหรับการสำรวจเกิน 2–3 ชั่วโมง
7. **Dead Zone/Low Signal Area:** พื้นที่อับสัญญาณทำให้เช็คอินหยุดทำงานชั่วคราว ระบบแจ้งเตือนและระงับการเช็คอินจนสัญญาณกลับมาเสถียร
8. **Offline Usage:** ยังไม่รองรับ — แนวทางแก้ในเวอร์ชันถัดไปคือพัฒนาเป็น Progressive Web App (PWA)

---

## Device & Platform Requirements

| รายการ | ข้อกำหนด |
|---|---|
| ประเภทอุปกรณ์ | คอมพิวเตอร์/แล็ปท็อป, แท็บเล็ต, มือถือ |
| เบราว์เซอร์ | Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+ ที่รองรับ HTML5 Geolocation API [10] และ ES6+ |
| ระบบปฏิบัติการ | Android 9+ / iOS 14+ / Windows 10+ / macOS 11+ |
| อินเทอร์เน็ต | 4G หรือ Wi-Fi ขั้นต่ำ 5 Mbps แนะนำ (สำหรับ Leaflet.js [14] และ Supabase) |
| GPS / Location Service | จำเป็น — ต้องอนุญาตในเบราว์เซอร์ |
| พื้นที่จัดเก็บ | ไม่ต้องการ — เป็น Web App |
| RAM | 2 GB ขึ้นไป (แนะนำ 4 GB) |

---

## User Audience

### กลุ่มผู้ใช้ที่ออกแบบมาเพื่อ (Designed Target)

นักเรียนมัธยมศึกษาตอนปลาย (ม.4–ม.6) และนักศึกษาอุดมศึกษา อายุ 15–23 ปี ที่เรียนวิชาประวัติศาสตร์/สังคมศึกษา — กลุ่มที่โครงการมุ่งแก้ปัญหาขาดแรงจูงใจและคะแนน O-NET ต่ำกว่า 24% [1] โดยตรง

### กลุ่มผู้ใช้จริงที่คาดการณ์ (Projected Real-World Audience)

1. นักเรียน ม.1–ม.6 ที่ใช้งานด้วยความสมัครใจ เพื่อทบทวนความรู้ก่อนสอบ O-NET [1] หรือระหว่างทัศนศึกษา
2. นักศึกษาและ First Jobber อายุ 18–28 ปี ที่คุ้นเคยกับสื่อดิจิทัล ใช้แอปในวันหยุดหรือระหว่างท่องเที่ยว
3. สถานศึกษาและครูผู้สอน ที่กำหนดพื้นที่/ภารกิจให้นักเรียนทำเป็นกิจกรรมกลุ่มระหว่างทัศนศึกษา
4. ผู้ปกครองที่ต้องการกิจกรรมเสริมความรู้ร่วมกับบุตรหลาน
5. ผู้สนใจประวัติศาสตร์เป็นการส่วนตัว (History Enthusiasts) ที่มีแรงจูงใจสูงอยู่แล้ว
6. นักท่องเที่ยวและบุคคลทั่วไปที่ต้องการบริบทเพิ่มเติมจากสถานที่จริง

---

## Post-Platform Testing

### Methodology

**Intrinsic Motivation Inventory (IMI)**

ใช้แบบสอบถามมาตรฐาน IMI ของ Deci & Ryan (1985) [2][3] วัด 4 มิติ — ความสนใจ/ความสนุก, ความสามารถที่รับรู้, ความรู้สึกเลือกได้เอง, ระดับความกดดัน — เก็บข้อมูล 3 ช่วง: ก่อนใช้แอป (Baseline), ทันทีหลังใช้, และ 2 สัปดาห์หลังใช้ (วัดความคงอยู่ของแรงจูงใจ)

**Behavioral Engagement Indicators**

อ้างอิงกรอบ User Engagement ของ O'Brien & Toms (2008) [16] วัดจากข้อมูลพฤติกรรมจริงในฐานข้อมูล Supabase:

- 7-Day Retention Rate
- Average Session Duration
- จำนวนการเช็คอินต่อคนต่อสัปดาห์
- Lore Reading Depth (Time-on-Page ≥ 30 วินาที และ Scroll ≥ 70% ถือว่า "อ่านเนื้อหา")

**Learning Outcome**

อ้างอิง Bloom's Revised Taxonomy [4] วัด 2 ระดับแรก — Remember (จดจำชื่อ/วันที่/เหตุการณ์) และ Understand (อธิบายความสัมพันธ์ระหว่างบุคคล เหตุการณ์ สถานที่) เปรียบเทียบ Pre/Post-test กับกลุ่มควบคุมที่อ่านตำราอย่างเดียว ทดสอบซ้ำหลัง 2 สัปดาห์ และติดตาม Quiz Accuracy Rate จากข้อมูลในแอป

### Suggested Additional Measurements

นอกเหนือจาก IMI, Behavioral Engagement และ Learning Outcome ที่ระบุไว้ในเอกสารต้นฉบับ แนะนำให้เพิ่มเครื่องมือวัดผลต่อไปนี้ เพื่อให้ครอบคลุมทั้งมิติ Usability และความน่าเชื่อถือทางเทคนิค ซึ่งกรรมการ NSC มักให้ความสำคัญควบคู่กับผลด้านการศึกษา:

| เครื่องมือ/ตัวชี้วัด | วัดอะไร | วิธีเก็บข้อมูล | เกณฑ์อ้างอิง |
|---|---|---|---|
| **System Usability Scale (SUS)** | ความใช้ง่ายของ UI โดยรวม (10 ข้อ, Likert 5 ระดับ) | แบบสอบถามหลังทดลองใช้ครั้งแรก | คะแนนเฉลี่ยมาตรฐานอุตสาหกรรม ≈ 68/100 |
| **Task Success Rate / Time-on-Task** | ผู้ใช้ทำ Flow หลักสำเร็จหรือไม่ (Login → Check-in → Capture) และใช้เวลานานเท่าใด | สังเกตการณ์/บันทึกหน้าจอระหว่าง Usability Testing กับผู้ใช้ 5–8 คน | % สำเร็จ และเวลาเฉลี่ยต่อ Flow |
| **GPS Check-in Success Rate (Field Test)** | ความแม่นยำของระบบ GPS ในสภาพจริง | บันทึกจำนวนครั้งเช็คอินสำเร็จ/ล้มเหลว พร้อมค่าความคลาดเคลื่อน (เมตร) แยกตามประเภทพื้นที่ (โล่ง/อาคารสูง/อับสัญญาณ) | อ้างอิงค่า Tolerance Radius ที่ตั้งไว้ |
| **Crash-Free Session Rate** | เสถียรภาพของแอประหว่างทดสอบภาคสนาม | นับจำนวน Error/Exception จาก Browser Console หรือ Supabase Logs ต่อจำนวน Session ทั้งหมด | เป้าหมาย ≥ 95% Crash-free |
| **Net Promoter Score (NPS)** หรือ Satisfaction Rating | ความพึงพอใจโดยรวมและแนวโน้มแนะนำต่อ | คำถามปลายปิด 1 ข้อ (0–10) ท้ายแบบสอบถาม | จัดกลุ่ม Promoter/Passive/Detractor |
| **Content Accuracy Review** | ความถูกต้องของเนื้อหา Lore/Quiz | ให้อาจารย์ที่ปรึกษาหรือผู้เชี่ยวชาญตรวจสอบสุ่มตัวอย่างเนื้อหาที่เผยแพร่แล้ว | % เนื้อหาที่ผ่านโดยไม่ต้องแก้ไข |

### Results

> เอกสารต้นฉบับมีเพียงระเบียบวิธี (Methodology) แต่ยังไม่มีผลการทดสอบจริง ตารางด้านล่างเป็นโครงสร้างสำหรับกรอกผลลัพธ์หลังดำเนินการทดสอบกับผู้ใช้จริง

**Pilot Test Overview**

| รายการ | รายละเอียด |
|---|---|
| จำนวนผู้เข้าร่วมทดสอบ | _ระบุจำนวนคน_ |
| ช่วงเวลาทดสอบ | _วันที่เริ่ม–สิ้นสุด_ |
| พื้นที่ทดสอบ | _เช่น กรุงเทพมหานคร, อยุธยา_ |
| กลุ่มตัวอย่าง | _เช่น นักเรียน ม.4–6 จำนวน N คน_ |
| กลุ่มควบคุม (ถ้ามี) | _เช่น อ่านตำราอย่างเดียว N คน_ |

**IMI Results**

| มิติ | Pre-test | Post-test 1 (ทันที) | Post-test 2 (2 สัปดาห์) | % เปลี่ยนแปลง |
|---|---|---|---|---|
| Interest/Enjoyment | _–_ | _–_ | _–_ | _–_ |
| Perceived Competence | _–_ | _–_ | _–_ | _–_ |
| Perceived Choice | _–_ | _–_ | _–_ | _–_ |
| Pressure/Tension | _–_ | _–_ | _–_ | _–_ |

**Behavioral Engagement Results**

| ตัวชี้วัด | ค่าที่วัดได้ |
|---|---|
| 7-Day Retention Rate | _–_ |
| Average Session Duration | _–_ |
| เช็คอินเฉลี่ยต่อคนต่อสัปดาห์ | _–_ |
| Lore Reading Depth (% ผ่านเกณฑ์ ≥30s/≥70% scroll) | _–_ |

**Learning Outcome Results**

| ระดับ Bloom's Taxonomy | คะแนนก่อนใช้ | คะแนนหลังใช้ | กลุ่มควบคุม | นัยสำคัญทางสถิติ |
|---|---|---|---|---|
| Remember | _–_ | _–_ | _–_ | _–_ |
| Understand | _–_ | _–_ | _–_ | _–_ |
| Quiz Accuracy Rate (จากแอป) | — | _–_ | — | — |

**Usability & Technical Results**

| ตัวชี้วัด | ค่าที่วัดได้ |
|---|---|
| SUS Score | _–_ / 100 |
| Task Success Rate (Login→Check-in→Capture) | _–_ % |
| GPS Check-in Success Rate (สนามจริง) | _–_ % (ค่าคลาดเคลื่อนเฉลี่ย _–_ ม.) |
| Crash-Free Session Rate | _–_ % |
| NPS / Satisfaction Rating | _–_ |

**สรุปผลและข้อสังเกต**

_สรุปประเด็นสำคัญจากผลการทดสอบ เช่น แรงจูงใจเพิ่มขึ้นอย่างมีนัยสำคัญหรือไม่ จุดที่ผู้ใช้ติดขัดบ่อยที่สุด และข้อเสนอแนะเพื่อปรับปรุงก่อน Deploy จริง_

---

## Problems & Obstacles

1. **ความแม่นยำ GPS:** พบความผิดพลาดเป็นบางครั้งในพื้นที่รัศมีแคบ (~20 ม.) และพื้นที่สัญญาณอับ ต้องทดสอบภาคสนามหลายสภาวะเพื่อปรับ Tolerance Radius
2. **การปลอมแปลงพิกัด (GPS Spoofing):** ความเสี่ยงที่ผู้ใช้ปลอมพิกัดเพื่อเช็คอินโดยไม่เดินทางจริง — ดูมาตรการป้องกันแบบเต็มที่ [Anti-Spoofing Measures](#anti-spoofing-measures-gps-spoofing-prevention) ภายใต้ [Software Specifications](#software-specifications)
3. **ขนาดข้อมูล GeoJSON:** ต้อง Data Simplification เพื่อลดเวลาโหลดโดยไม่เสียความแม่นยำของ Polygon Matching
4. **ความครอบคลุมเนื้อหา:** การรวบรวมและตรวจสอบข้อมูลบุคคล/Lore/Quiz ครบทุกจังหวัดใช้เวลาและทรัพยากรสูง ต้องทำเป็นระยะ
5. **สมดุลเกม-การศึกษา:** ต้องรักษาสมดุลระหว่างความสนุกและคุณค่าทางการศึกษา ไม่ให้ฝ่ายใดมีน้ำหนักเกินไป
6. **การทดสอบภาคสนาม:** การทดสอบฟังก์ชันเช็คอินในสถานที่จริงต้องใช้การเดินทาง ทำให้รอบ Iteration ช้ากว่าซอฟต์แวร์ทั่วไป

---

## Development Phases

แผนพัฒนาแบ่งเป็น 5 ระยะ ตั้งแต่ Web MVP ที่พัฒนาเสร็จแล้ว ไปจนถึงวิสัยทัศน์ระยะยาวด้าน Live-Service และ Business Ecosystem โดยแต่ละระยะต่อยอดจากสถาปัตยกรรมเดิมโดยไม่ทิ้งของเก่า

### Phase 1 — Web MVP *("The Digital Lab" Foundation)* — ✅ Completed

**Goal:** เปิดตัวเว็บแอปแบบ Mobile-Responsive เพื่อทดสอบกลไก "Watchtower" และ "Fog of War" กับผู้ใช้จริง

**Core Mechanics:** GPS Check-in ที่จุดสังเกตการณ์ → ปลดล็อกแผนที่จาก Sepia/มืดให้กลายเป็นสี (Fog Reveal) → แบบทดสอบเลือกตอบสำหรับบุคคลระดับ C-Class

**Tech Focus:** Map integration (ปัจจุบันใช้ **Leaflet.js 1.9.4** + CartoDB Dark Matter — ดู [Tech Stack](#tech-stack); Mapbox เป็นตัวเลือกสำหรับการอัปเกรดในระยะถัดไปหากต้องการ 3D/Vector Tiles ขั้นสูงกว่า) ร่วมกับ **Supabase** เป็น Backend

### Phase 1.5 — Co-Op & Community *("Social" Layer)* — ✅ Completed + 🔜 In Planning

**Goal:** เปลี่ยนการล่าบุคคลสำคัญแบบเดี่ยวให้กลายเป็นประสบการณ์แบบทีม

**Core Mechanics:**
- Raid Encounters — บุคคลระดับตำนานที่ต้องใช้ผู้เล่น 3 คนขึ้นไปช่วยกันตอบโจทย์ที่ซับซ้อนพร้อมกัน ✅
- District Leaderboards — จัดอันดับคะแนนแยกตามเขต/กลุ่ม ✅
- Trading System — แลกเปลี่ยน Artifact/ไอเทมท้องถิ่นระหว่างผู้เล่น 🔜 *(ยังไม่พัฒนา — เสนอเป็นส่วนต่อขยายของ `user_artifacts` ในระยะถัดไป)*

**Tech Focus:** Realtime Sockets สำหรับการเล่นแบบหลายผู้ใช้พร้อมกัน — ปัจจุบันใช้ **Supabase Realtime + Broadcast Channel + Presence** (ดู [Database Schema](#software-specifications)); ส่งมอบผ่าน `supabase/patch_coop.sql`

### Phase 2 — Mobile App Transition *("Immersive" Leap)* — 🔜 Planned

**Goal:** ย้ายจากเบราว์เซอร์ไปสู่แอปบน App Store/Play Store โดยเฉพาะ

**Core Mechanics:**
- Native AR Capture — มองเห็นบุคคลสำคัญปรากฏในโลกจริงผ่านกล้อง (ต่อยอดแนวคิด Historical Vision AI — จำกัดขอบเขตการจดจำภาพด้วยพิกัด GPS ก่อนเพื่อลดภาระประมวลผลและเพิ่มความแม่นยำ)
- Background GPS Tracking สำหรับการแจ้งเตือน "Echo" เมื่อมีจุดที่น่าสนใจอยู่ใกล้
- QR Code Scanning สำหรับ Outpost ประเภทร้าน OTOP/คาเฟ่ (ทดแทน/เสริมการเช็คอินด้วย GPS อย่างเดียว)
- รองรับการใช้งานออฟไลน์บางส่วน (Cache แผนที่/เนื้อหา) สืบเนื่องจากแนวคิด PWA เดิม

**Tech Focus:** เปลี่ยนผ่านสู่ **React Native** และ Native AR Engine (เช่น ARKit/ARCore)

### Phase 4 — Seasonal Shifts & Global Themes *("Live Service" Era)* — 🔜 Planned

**Goal:** รักษาความสดใหม่ของเนื้อหาด้วยการหมุนเวียนธีม "Main Quest" ตามฤดูกาล

**Core Mechanics:**
- Season 1: Ayutthaya Rising
- Season 2: The Silk Road (ประวัติศาสตร์ระดับโลก)
- Season 3: Modern Revolution
- **Era Filters:** สลับมุมมองแผนที่ตามยุคสมัยได้ — เปิดทางให้ขยายขอบเขตเนื้อหาออกนอกประเทศไทย รวมถึงรองรับเควสประวัติศาสตร์ระดับสากลหรือเควสที่สนับสนุนโดยแบรนด์ในอนาคต
- รองรับหลายภาษา (อังกฤษและภาษาอื่น) เพื่อรองรับนักท่องเที่ยวต่างชาติและธีม Global History

### Phase 5 — Business & Media Ecosystem — 🔜 Planned

**Goal:** สร้างรายได้ให้แพลตฟอร์มผ่านความร่วมมือเชิงกลยุทธ์กับภาคเอกชนและภาครัฐ

**Core Mechanics:**
- **Media Tie-ins:** ร่วมมือกับสตูดิโอภาพยนตร์/ละคร เพื่อปล่อยตัวละครรุ่นลิมิเต็ดจากละครพีเรียดยอดนิยม (เช่น บุพเพสันนิวาส)
- **Brand Outposts:** ร้านค้า/สถานที่ที่ได้รับการรับรองกลายเป็น "Premium Node" ที่ผู้เล่นแลกส่วนลดจริงด้วย "Stamina" ในเกม
- **Government Bounties:** กิจกรรมที่สนับสนุนโดยการท่องเที่ยวแห่งประเทศไทย (ททท.) เพื่อกระตุ้นนักท่องเที่ยวสู่จังหวัดรอง — ต่อยอดจากแนวคิดความร่วมมือกับกรมศิลปากร [17] ที่ระบุไว้ในระยะก่อนหน้า
- **Green Logistics:** "Public Transport Rewards" — ผู้เล่นที่เดินทางด้วยเรือหรือรถไฟได้รับ XP Multiplier และรางวัลพิเศษ เพื่อสนับสนุนการเดินทางที่ยั่งยืน

---

## Summary & Recommendations

### Summary

โครงงาน "ตามรอย" พัฒนาเว็บแอปพลิเคชันที่ผสาน Gamification กับ Geolocation เพื่อแก้ปัญหาการขาดแรงจูงใจในการเรียนประวัติศาสตร์ไทย ซึ่งสะท้อนจากคะแนน O-NET เฉลี่ยต่ำกว่า 24% [1] โดยอิงทฤษฎี Situated Learning ของ Lave & Wenger [5] และ Experiential Learning Cycle ของ Kolb [6] ทำให้การเรียนรู้เกิด ณ สถานที่จริงที่เหตุการณ์เกิดขึ้น แทนการท่องจำจากตำรา

**Phase 1 (Web MVP)** ส่งมอบ Fog of War, Capture Loop, ระบบ Lore ตามตำแหน่งจริง, และ Realtime Leaderboard บนสถาปัตยกรรม HTML5/Bootstrap 5.3/Vanilla JS + Supabase **Phase 1.5 (Co-Op & Community)** เติมเต็มมิติ Community of Practice [5] ด้วย Guild System, Collaborative Missions, Raid Encounters, และ Discussion Threads — ทั้งหมดบนสถาปัตยกรรมเดิมโดยไม่เพิ่ม Dependencies ผ่าน `supabase/patch_coop.sql` ระยะถัดไป (Phase 2, 4, 5) มุ่งสู่ Native Mobile App พร้อม AR, เนื้อหาแบบ Live-Service ตามฤดูกาล, และความร่วมมือเชิงธุรกิจ/ภาครัฐ — ดูรายละเอียดที่ [Development Phases](#development-phases)

### Recommendations

1. **Content Design:** วาง Learning-First ตั้งแต่ต้น — ใช้ Bloom's Taxonomy [4] กำกับคำถามเพื่อพัฒนาความเข้าใจจริง ไม่ใช่แค่จดจำเพื่อผ่านด่าน
2. **Data Integrity:** สำหรับแอปด้านความรู้เฉพาะทาง ควรมี Domain Expert Advisor และกระบวนการ Content Review ที่ชัดเจนตั้งแต่เริ่มพัฒนา
3. **GPS Technology:** ออกแบบรองรับความไม่แน่นอนของสัญญาณตั้งแต่แรก — Tolerance Radius, Throttling, และ Server-side Validation เพื่อป้องกัน Spoofing
4. **Scalability:** ลงทุนกับ RLS และ Edge Functions ที่แยกจาก Client Logic ตั้งแต่ Phase 1 ช่วยให้ขยายระบบในระยะถัดไปง่ายขึ้นมาก แม้ดูเกินจำเป็นในช่วงแรก
5. **Future Research:** ความสัมพันธ์ระหว่างระยะทางเดินทางกับคะแนน Post-test, ประสิทธิผลของ Location-based Learning เทียบกับห้องเรียน, และผลของ Gamification ต่อ Knowledge Retention ระยะ 2–4 สัปดาห์

---

## References

[1] สถาบันทดสอบทางการศึกษาแห่งชาติ (องค์การมหาชน). (2566). รายงานผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET) ชั้นมัธยมศึกษาปีที่ 6. สทศ. https://www.niets.or.th/th/content/download/26060

[2] Deci, E. L., & Ryan, R. M. (1985). *Intrinsic motivation and self-determination in human behavior.* Plenum Press. https://link.springer.com/book/10.1007/978-1-4899-2271-7

[3] Deci, E. L., & Ryan, R. M. (n.d.). *Intrinsic Motivation Inventory (IMI).* Self-Determination Theory. https://selfdeterminationtheory.org/intrinsic-motivation-inventory/

[4] Anderson, L. W., & Krathwohl, D. R. (Eds.). (2001). *A taxonomy for learning, teaching, and assessing: A revision of Bloom's educational objectives.* Longman.

[5] Lave, J., & Wenger, E. (1991). *Situated learning: Legitimate peripheral participation.* Cambridge University Press.

[6] Kolb, D. A. (1984). *Experiential learning: Experience as the source of learning and development.* Prentice-Hall.

[7] Deterding, S., Dixon, D., Khaled, R., & Nacke, L. (2011). From game design elements to gamefulness: Defining "gamification". *Proceedings of the 15th International Academic MindTrek Conference* (pp. 9-15). ACM.

[8] Counsell, C. (2004). Looking through a Josephine-Butler-shaped window: Focusing pupils' thinking on historical significance. *Teaching History*, 114, 30–33.

[9] Partington, G. (1980). *The idea of an historical education.* NFER Publishing.

[10] MDN Web Docs. (n.d.). *Geolocation API.* Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

[11] Bootstrap. (n.d.). *Bootstrap 5.3 documentation.* https://getbootstrap.com/docs/5.3/

[12] Supabase. (n.d.). *Supabase documentation.* https://supabase.com/docs

[13] Vercel. (n.d.). *Vercel documentation.* https://vercel.com/docs

[14] Leaflet. (n.d.). *Leaflet 1.9.4 documentation.* https://leafletjs.com/reference.html

[15] สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล. (2562). *พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562.* https://www.pdpc.or.th

[16] O'Brien, H. L., & Toms, E. G. (2008). What is user engagement? A conceptual framework for defining user engagement with technology. *Journal of the American Society for Information Science and Technology*, 59(6), 938–955.

[17] กรมศิลปากร. (2566). *ฐานข้อมูลระบบภูมิสารสนเทศแหล่งโบราณคดีและโบราณสถานไทย.* https://gis.finearts.go.th

[18] สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน. (2560). *หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560).* https://www.obec.go.th

---

## Developer Contacts & Bio

| ผู้พัฒนา | บทบาท | ผลงาน/รางวัล |
|---|---|---|
| นาย รพี รัตนมนูญพร | ผู้พัฒนา | — |
| นางสาว รชยา เชวงกิจวณิช | ผู้พัฒนา | AI HACKATHON Elephant Identification 2025 (2nd Runner-Up); NSTDA Micro-Mouse Contest 2026 ระดับประเทศ (2nd Runner-Up) |
| นาย ปภาวิชญ์ แซ่หลิ่ว | ผู้พัฒนา | Samsung × KBTG Digital Fraud Cybersecurity Hackathon 2025 (Top 8 Finalist); Innovedex Robotics Competition 2025 (3rd Runner-Up); Road to AI Cybersecurity 2025 (Beginner) (2nd Runner-Up); AI Hackathon Elephant Identification 2025 (3rd Runner-Up); CEDT Innovation Summit 2026 (Semi-Finals) |

**อาจารย์ที่ปรึกษา:** อาจารย์ธนภูมิ เรืองไพศาล — โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร (ฝ่ายมัธยม)

**ติดต่อ/รายงานปัญหา:** [GitHub Issues — Ray0737/NSC_2026](https://github.com/Ray0737/NSC_2026/issues)

---

## Appendix

### Appendix A — Installation Guide

**Prerequisites**

| เครื่องมือ | เวอร์ชันขั้นต่ำ | หมายเหตุ |
|---|---|---|
| Git | 2.40+ | https://git-scm.com |
| VS Code | รุ่นล่าสุด | https://code.visualstudio.com |
| VS Code Extension: Live Server | รุ่นล่าสุด | Ritwick Dey — Serve ไฟล์แบบ Static HTTP |
| Node.js | 18+ | จำเป็นเฉพาะรัน Static Tests |
| บัญชี Supabase | — | https://supabase.com |
| บัญชี Vercel | — | https://vercel.com |

**Developer Setup**

```bash
# 1. โคลนโปรเจกต์
git clone https://github.com/Ray0737/NSC_2026.git
cd NSC_2026
```

```js
// 2. ตั้งค่า js/env.js
window.ENV = {
  SUPABASE_URL: 'https://<your-project-id>.supabase.co',
  SUPABASE_ANON_KEY: '<your-anon-key>'
};
```

```
# 3. ตั้งค่าฐานข้อมูล — รันตามลำดับใน Supabase SQL Editor
1. supabase/schema.sql              — Tables, Triggers, RLS, Leaderboard View
2. supabase/patch_auth_fix.sql      — Auth Trigger fix + RLS INSERT Policy
3. supabase/patch_lore.sql          — Lore/Support-node/Quiz tables + Legacy Score trigger
4. supabase/patch_district_seed.sql — Seed 13 Districts ให้ตรงกับ map.js
5. supabase/patch_coop.sql          — Phase 1.5 Co-op tables/triggers/RLS (idempotent)
```

จากนั้นใน Supabase Dashboard → Authentication: ปิด "Confirm email" สำหรับ Dev และเพิ่ม `http://127.0.0.1:5500/**` ใน URL Configuration

```bash
# 4. รันโปรเจกต์
# เปิดโฟลเดอร์ใน VS Code แล้วกด "Go Live"
# เปิด http://127.0.0.1:5500/index.html
# (localhost/127.0.0.1 จะ Bypass GPS Distance Check อัตโนมัติ)

# 5. รัน Static Tests
node tests/run-static.mjs
```

**Deploy ขึ้น Vercel**

1. เชื่อมต่อ Vercel กับ GitHub Repository `Ray0737/NSC_2026`
2. Vercel ตรวจจับ Static Site และใช้ `build.js` เป็น Build Command
3. เพิ่ม Environment Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
4. Deploy — ทุก push ขึ้น GitHub จะ deploy เวอร์ชันใหม่อัตโนมัติ

**End User Requirements** — ดู [Device & Platform Requirements](#device--platform-requirements)

### Appendix B — How to Play Guide

**เริ่มต้นใช้งาน:** เข้าสู่ระบบด้วย Google/อีเมล → อนุญาต Location Service → เลือกเขตบ้านเกิด

**การใช้งานแผนที่:**
- **Fog of War:** พื้นที่สีดำทึบคือยังไม่สำรวจ ต้องเดินทางไปจริงเพื่อเปิดเผย
- **Watchtower:** ไอคอนหอสังเกตการณ์คือจุดเช็คอิน ต้องอยู่ในรัศมี 500 ม.
- **Legendary Figure:** ไอคอน 🔒 คือบุคคลที่ต้องทำภารกิจครบก่อนจึงจับได้

**Gameplay Loop:**

```
เดินทางไปจุดสังเกตการณ์ → เช็คอิน (รัศมี 500 ม.)
→ Fog of War เปิดเผย → เยี่ยมชม Support Nodes (ร้านกาแฟ/OTOP/สถานที่)
→ ปลดล็อก Lore → ทำแบบทดสอบ (Quiz)
→ จับบุคคลสำคัญ (Capture) → รับ Legacy Score → อันดับ Leaderboard สูงขึ้น
```

**Troubleshooting**

| ปัญหา | สาเหตุที่เป็นไปได้ | วิธีแก้ไข |
|---|---|---|
| เช็คอินไม่ได้ | GPS ไม่แม่นยำ หรือ Location ปิด | ตรวจสอบสิทธิ์ Location ในเบราว์เซอร์ ออกไปที่โล่ง |
| แผนที่โหลดช้า | อินเทอร์เน็ตช้า/Map Tiles โหลดนาน | รอสักครู่หรือรีเฟรช |
| ล็อกอินไม่ได้ | Session หมดอายุ | ล้าง Cache แล้วล็อกอินใหม่ |
| Leaderboard ไม่อัปเดต | Realtime connection ขาด | รีเฟรชและตรวจสอบอินเทอร์เน็ต |

### Appendix C — Software Disclaimer

- **วัตถุประสงค์:** พัฒนาเพื่อการศึกษาในลักษณะ Non-Commercial Educational Tool ภายใต้ NSC 2026
- **ความถูกต้องของเนื้อหา:** เป็นสื่อเสริมการเรียนรู้ ไม่ใช่แหล่งอ้างอิงทางวิชาการขั้นสุดท้าย ข้อมูลบางส่วนอาจมีการตีความต่างกันในหมู่นักประวัติศาสตร์ ผู้ใช้ควรตรวจสอบเพิ่มเติมจากแหล่งหลัก เช่น กรมศิลปากร
- **ข้อมูลส่วนบุคคล:** เก็บเฉพาะอีเมล ชื่อผู้ใช้ และพิกัด ณ เวลาเช็คอิน ตาม PDPA พ.ศ. 2562 — รายละเอียดในหน้า Onboarding
- **ข้อจำกัดความรับผิด:** ทีมผู้พัฒนาและโรงเรียนไม่รับผิดต่อความเสียหายจากความผิดพลาดของ GPS ข้อมูลไม่ครบถ้วน หรือปัญหาทางเทคนิคที่อยู่นอกเหนือการควบคุม
- **ทรัพย์สินทางปัญญา:** Source Code เป็นลิขสิทธิ์ของทีมผู้พัฒนา ห้ามคัดลอก/ดัดแปลง/ใช้เชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร เนื้อหาประวัติศาสตร์อ้างอิงแหล่งสาธารณะตามบรรณานุกรม
- **ติดต่อ:** [GitHub Issues](https://github.com/Ray0737/NSC_2026/issues)
