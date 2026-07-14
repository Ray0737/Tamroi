# Historical Figures Database (Supabase `figures` table)

Source: Supabase project `NSC` (`lnvpolwznueiklfgycei`). Full regen from live data.
Snapshot date: 2026-07-13 (post tier-reclass, see `supabase/patch_tier_reclass.sql`).

Columns: `id`, `name_th`, `name_en`, `class` (S/A/B/C), `legacy_pts`, `district_id` → `district_name`, `description`, `image_emoji`, `is_active`, `raid_only`, `raid_min_players`, `lat`, `lng`.

## Tier reclassification — resolved 2026-07-13

The citation/rubric review flagged 20 figures as strained or borderline against the scale/duration/evidence criteria; applied live via `supabase/patch_tier_reclass.sql`:

- **S→A** (1): `fig-s-16` Chao Phraya Yomarat — city/ministry-scale, not kingdom-founding.
- **A→B** (6): `fig-a-09`, `fig-a-11`, `fig-a-14`, `fig-a-16`, `fig-a-18`, `fig-a-19` — single-contribution or supporting-role claims.
- **B→A** (8): `fig-b-02`, `fig-b-05`, `fig-b-06`, `fig-b-09`, `fig-b-12`, `fig-b-13`, `fig-b-15`, `fig-b-19` — national-institution-founding scale undersold at B.
- **B→C** (1): `fig-b-18` — single-event appearance, thin evidence.
- **C→B** (3): `fig-c-09`, `fig-c-15`, `fig-c-19` — named institutional actors, doesn't fit the anonymous-collective C archetype.
- **Removed**: `fig-mock-satit-b-01` (QA fixture, plus its 2 `user_captures` and 9 `quiz_questions` rows).

Live counts: **S 10 · A 23 · B 20 · C 20** (73 total). Conditional (S+A) share is 45% vs. the 20%-conditional design target in the proposal doc — a separate ratio-only pass is still needed if that target is to be hit.

## Class S — Legendary (500 pts, 10 figures)

| Emoji | ID | Name (EN) | Name (TH) | District | Raid Only | lat, lng | Description |
|---|---|---|---|---|---|---|---|
| ⚔️ | `fig-s-19` | Chao Phraya Bodindecha (Sing Singhaseni) | เจ้าพระยาบดินทรเดชา (สิงห์ สิงหเสนี) | ดุสิต (dusit) | No | 13.7705, 100.5100 | Supreme commander of the Siamese army under King Rama III; led the Siamese–Vietnamese War (Anam Sayam Yut) and campaigns across Cambodia and Laos, defending and expanding Siam's borders for over a decade. One of the most celebrated non-royal military statesmen of the early Rattanakosin era. Replaced 2026-07-12 — the prior `fig-s-19` was Princess Sirindhorn, a living member of the current reigning family; pulled for the same content-sensitivity reason the Rama-line kings were removed. |
| 📖 | `fig-s-12` | King Lithai of Sukhothai | สมเด็จพระมหาธรรมราชาที่ 1 (ลิไทย) | พระนคร (rattanakosin) | No | 13.7530, 100.4880 | Authored the Traiphum Phra Ruang (1345 CE), the first Thai geographical and cosmological treatise, foundation of Thai Buddhist cosmology, shaping Thai art, architecture, and social order for centuries. |
| 🏆 | `fig-s-10` | King Naresuan the Great | สมเด็จพระนเรศวรมหาราช | อยุธยา (ayutthaya) | No | 14.3692, 100.5878 | Defeated Burmese Prince Mingyi Swa in a legendary elephant duel in 1593, ending decades of Burmese domination over Ayutthaya. Restored Siamese sovereignty. |
| 🔤 | `fig-s-13` | King Ramkhamhaeng the Great | พ่อขุนรามคำแหงมหาราช | พระนคร (rattanakosin) | No | 13.7563, 100.4915 | Created the Thai alphabet around 1283. His stone inscription is the oldest surviving record of the Thai language and a UNESCO Memory of the World. |
| ⚔️ | `fig-s-01` | King Taksin the Great | สมเด็จพระเจ้าตากสินมหาราช | พระนคร (rattanakosin) | **Yes** | 13.7479, 100.4918 | Reunited Siam after the fall of Ayutthaya in 1767; founded the Thonburi Kingdom and expelled the Burmese invaders. Reigned 1767–1782. |
| ⚓ | `fig-s-17` | Prince Chumphon | พระเจ้าบรมวงศ์เธอ กรมหลวงชุมพรเขตอุดมศักดิ์ | บางรัก/สีลม (silom) | No | 13.7270, 100.5230 | "Father of the Royal Thai Navy"; modernized naval forces, founded the Naval Cadet School, introduced modern naval warfare doctrines. Deeply venerated as a protective deity. |
| 📚 | `fig-s-20` | Prince Damrong Rajanubhab | กรมพระยาดำรงราชานุภาพ | ดุสิต (dusit) | No | 13.7735, 100.5015 | "Father of Thai History." Founded the National Library, National Museum, and modern Thai education system. As Minister of Interior under Rama V, restructured provincial administration still foundational today. |
| 🎨 | `fig-s-18` | Prince Naris | สมเด็จเจ้าฟ้ากรมพระยานริศรานุวัดติวงศ์ | พระนคร (rattanakosin) | No | 13.7480, 100.4870 | Versatile genius — architect, painter, composer, poet. Designed Wat Benchamabophit (Marble Temple, 1899–1911); led the 1926–1932 restoration of the Chakri Maha Prasat throne hall's roof spires. |
| 🐘 | `fig-s-09` | Queen Sri Suriyothai | สมเด็จพระศรีสุริโยทัย | อยุธยา (ayutthaya) | No | 14.3505, 100.5648 | Gave her life in 1548 to save King Maha Chakkraphat in battle against the Burmese, riding into combat disguised as a warrior. One of few women in Thai history to receive the royal title Somdet. |
| 🛡️ | `fig-s-14` | Somdet Sri Suriyawong | สมเด็จเจ้าพระยาบรมมหาศรีสุริยวงศ์ (ช่วง บุนนาค) | บางรัก/สีลม (silom) | No | 13.7254, 100.5236 | Most powerful regent of the Rattanakosin era; regent during Rama V's minority (1868–1873). Modernized the Siamese military, managed relations with Britain/France/US while keeping Siam independent. |

## Class A — Epic (200 pts, 23 figures)

| Emoji | ID | Name (EN) | Name (TH) | District | lat, lng | Description |
|---|---|---|---|---|---|---|
| ⚓ | `fig-a-12` | Admiral Sindhu Kamalanavin | พลเรือเอก สินธุ กมลนาวิน | บางรัก/สีลม | 13.7260, 100.5300 | Commander of the Royal Thai Navy during WWII who navigated Thailand through the war with minimal naval losses, preserving Thai maritime sovereignty. |
| 🎩 | `fig-a-20` | Chao Phraya Bhaskarawong | เจ้าพระยาภาสกรวงษ์ (พร บุนนาค) | บางรัก/สีลม | 13.7310, 100.5240 | Educated in London from age 15; served as Siam's special royal envoy negotiating with Britain (1879) and later Germany. Became Siam's first Minister of Education. |
| 🏫 | `fig-a-05` | Chao Phraya Thammasakmontri | เจ้าพระยาธรรมศักดิ์มนตรี (สนั่น เทพหัสดิน ณ อยุธยา) | ดุสิต | 13.7735, 100.5110 | Founder of modern Thai education. Established compulsory primary education, founded the first teacher-training schools, standardized the Thai curriculum under Rama VI. |
| 🏙️ | `fig-s-16` | Chao Phraya Yomarat | เจ้าพระยายมราช (ปั้น สุขุม) | ดุสิต | 13.7725, 100.5145 | One of the most important administrators of the late Rattanakosin period. Modernized Bangkok's public health and city planning, reformed the Ministry of Interior. *(reclassified S→A 2026-07-13)* |
| 🎖️ | `fig-a-04` | Field Marshal Phibunsongkhram | แปลก พิบูลสงคราม (จอมพล ป.) | นนทบุรี | 13.8600, 100.5170 | Thailand's longest-serving PM (1938–1944, 1948–1957). Renamed the country from "Siam" to "Thailand" in 1939; commanded the alliance with Japan in WWII. |
| 📝 | `fig-a-06` | Kulap Saipradit (Sri Burapha) | กุหลาบ สายประดิษฐ์ (ศรีบูรพา) | สุขุมวิท | 13.7368, 100.5580 | Pioneering social-realist novelist. "Khang Lang Phap" explored class inequality unprecedented in Thai literature. Arrested and exiled for his politics. |
| 📰 | `fig-b-06` | MR Kukrit Pramoj | คึกฤทธิ์ ปราโมช (ม.ร.ว.) | บางรัก/สีลม | 13.7260, 100.5295 | Simultaneously novelist, classical dancer, newspaper founder, and PM (1975–1976). "Four Reigns" (สี่แผ่นดิน) is the most widely read Thai historical novel. *(reclassified B→A 2026-07-13)* |
| 🧘 | `fig-b-19` | Phra Mongkol Thepmuni (Luang Pu Sodh) | พระมงคลเทพมุนี (สด จนฺทสโร) | บางกะปิ | 13.7620, 100.6100 | Buddhist monk who developed the Dhammakaya meditation technique in the early 20th century, now practiced worldwide. *(reclassified B→A 2026-07-13)* |
| 🏺 | `fig-a-13` | Phraya Anuman Rajadhon | พระยาอนุมานราชธน (ยง เอี่ยมเอนก) | พระนคร | 13.7490, 100.4890 | "Father of Thai folklore studies." Systematically documented Thai customs, beliefs, festivals, folk traditions — the primary academic source for Thai cultural anthropology. |
| 🩺 | `fig-b-09` | Phraya Damrongphaetthayakhun (Chuen Phutthiphaet) | พระยาดำรงแพทยาคุณ (ชื่น พุทธิแพทย์) | ปทุมวัน | 13.7307, 100.5418 | Western-trained doctor; co-founded the Medical Association of Thailand and Thai Nursing Association, launched Thailand's first medical journal (1918), first dean of Faculty of Medicine, Chulalongkorn University (1947). *(reclassified B→A 2026-07-13)* |
| 📖 | `fig-a-15` | Phraya Sri Sunthon Wohan | พระยาศรีสุนทรโวหาร (น้อย อาจารยางกูร) | พระนคร | 13.7520, 100.4940 | Leading Thai linguist and grammar scholar of the 19th century. Authored the first systematic grammar of the Thai language and standardized spelling still used today. |
| 🎓 | `fig-a-03` | Pridi Banomyong | ปรีดี พนมยงค์ | ปทุมวัน | 13.7400, 100.5266 | Intellectual architect of the 1932 revolution. Founded Thammasat University (1934), led the Free Thai Movement against Japanese occupation, briefly PM in 1946. Died in exile in Paris, 1983. |
| 🏅 | `fig-a-17` | Prince Dhani Nivat | พระวรวงศ์เธอ กรมหมื่นพิทยาลาภพฤฒิยากร | ดุสิต | 13.7745, 100.5150 | Scholar-prince who served as regent in 1946; leading Pali scholar and historian. Writings on Thai kingship, Buddhist institutions, and court ceremony are foundational academic texts. |
| ⚖️ | `fig-b-15` | Prince Rabi Bodhanabaya (Rapi Phatthanasak) | พระเจ้าบรมวงศ์เธอ กรมหลวงราชบุรีดิเรกฤทธิ์ | ดุสิต | 13.7750, 100.5175 | "Father of Thai Law." As Minister of Justice founded Thailand's first law school (1897), reformed the court system to a modern codified legal framework. Commemorated annually on "Wan Rapi" (7 Aug). *(reclassified B→A 2026-07-13)* |
| ☸️ | `fig-b-02` | Prince-Patriarch Vajiranana Varorasa | สมเด็จพระมหาสมณเจ้า กรมพระยาวชิรญาณวโรรส | พระนคร | 13.7592, 100.5011 | Supreme Patriarch who reformed the Thai Sangha, standardized the Buddhist curriculum, founded Mahamakut Buddhist University; authored the first standardized Pali-Thai dictionary. *(reclassified B→A 2026-07-13)* |
| 💹 | `fig-b-05` | Prof. Puey Ungphakorn | ศาสตราจารย์ ดร. ป๋วย อึ๊งภากรณ์ | ปทุมวัน | 13.7320, 100.5490 | Economist and rector of Thammasat University; governor of the Bank of Thailand. Wrote "A Moral Individual in an Immoral Society" (1973); exiled after the 1976 massacre. *(reclassified B→A 2026-07-13)* |
| 🤝 | `fig-a-08` | Seni Pramoj | หม่อมราชวงศ์เสนีย์ ปราโมช | ปทุมวัน | 13.7280, 100.5480 | As Thai Ambassador to the US in 1941, refused to deliver Thailand's declaration of war against America. Later PM four times; co-founded the Democrat Party. |
| 🗿 | `fig-b-13` | Silpa Bhirasri (Corrado Feroci) | อาจารย์สิลป์ พีระศรี | ปทุมวัน | 13.7270, 100.5460 | Italian sculptor who became a Thai citizen; "father of modern Thai art." Created the Democracy Monument and Victory Monument. Founded Silpakorn University's Faculty of Painting and Sculpture. *(reclassified B→A 2026-07-13)* |
| ✍️ | `fig-a-01` | Sunthorn Phu | สุนทรภู่ | พระนคร | 13.7450, 100.4985 | Thailand's most celebrated poet (1786–1855). Epic "Phra Aphai Mani" is among the longest poems in Thai literature. UNESCO distinguished personality 1986. |
| 🕉️ | `fig-b-12` | Supreme Patriarch Vasana | สมเด็จพระอริยวงศาคตญาณ (วาสน์ วาสโน) | พระนคร | 13.7502, 100.4967 | Supreme Patriarch during the 1970s–80s; expanded Thai Buddhism internationally, established temples in Europe and America. *(reclassified B→A 2026-07-13)* |
| 💐 | `fig-a-07` | Thanpuying Plian Phasakorawongse | ท่านผู้หญิงเปลี่ยน ภาสกรวงศ์ | ปทุมวัน | 13.7330, 100.5420 | Bangkok society reformer of the Rama V era. During the 1893 Franco-Siamese crisis founded the "Sapha Unalom Daeng" (Red Unalom Society), forerunner of the Thai Red Cross. Authored the first published Thai cookbook. |
| 🎵 | `fig-a-10` | Uea Sunthornsanan | เอื้อ สุนทรสนาน (ครูเอื้อ) | พระนคร | 13.7480, 100.4950 | Founded the Sunthraporn Band (1939), Thailand's first Thai-Western fusion orchestra; composed hundreds of songs still performed. Founded the Music Association of Thailand. |
| 🏛️ | `fig-a-02` | Phraya Phahon Phonphayuhasena | พระยาพหลพลพยุหเสนา (พจน์ พหลโยธิน) | ดุสิต | 13.7697, 100.5137 | Leader of the 1932 Siamese Revolution that ended absolute monarchy; read the Declaration of the New Siamese State; second PM of Siam (1933–1938). |

## Class B — Rare (100 pts, 20 figures)

| Emoji | ID | Name (EN) | Name (TH) | District | lat, lng | Description |
|---|---|---|---|---|---|---|
| 🚔 | `fig-c-09` | Bangkok's First Metropolitan Police | ตำรวจนครบาลยุคแรก | ดุสิต | 13.7786, 100.5181 | Bangkok's first modern, British-trained police force established 1862 under Rama IV, led by Capt. Samuel Joseph Bird Ames. Separate 1897 reform created the Royal Siamese Provincial Gendarmerie under Danish officers. *(reclassified C→B 2026-07-13)* |
| 📩 | `fig-b-03` | Chao Phraya Ram Raghob | เจ้าพระยารามราฆพ (หม่อมหลวงเฟื้อ พึ่งบุญ) | ดุสิต | 13.7680, 100.5168 | Private secretary and closest confidant of King Rama VI; letters document internal palace debates about Thailand's political future in the 1920s. |
| 🗡️ | `fig-b-01` | Chao Phraya Surasak Montri | เจ้าพระยาสุรศักดิ์มนตรี (เจิม แสงชูโต) | ดุสิต | 13.7700, 100.5150 | Field commander under Rama V who pacified the Shan states and Lao principalities in the 1880s. |
| ✊ | `fig-b-10` | Free Thai Movement | สมาชิกขบวนการเสรีไทย | บางกะปิ | 13.7660, 100.6050 | Network of Thai students/officials who refused to collaborate with Japan in WWII; gathered Allied intelligence and sabotaged infrastructure. |
| 🎪 | `fig-b-04` | Khun Wichitmatra | ขุนวิจิตรมาตรา (สง่า กาญจนาคพันธุ์) | พระนคร | 13.7532, 100.4942 | Playwright/historian; compiled the most widely used Thai historical chronology of his era; served as Director of Fine Arts. |
| 🪖 | `fig-b-17` | Lt. Cdr. (W) Mayura Boonyarataphandhu | นาวาโทหญิง มายูร บุณยรัตพันธุ์ | ปทุมวัน | 13.7340, 100.5400 | Thailand's first female naval officer; drafted the Navy's women's uniform redesign, formally adopted 1951; founded the modern Navy Women's Office. |
| ✊ | `fig-c-15` | October Student Movement Members | กลุ่มนักศึกษาเดือนตุลา | พระนคร | 13.7567, 100.5017 | University students who organized protests at Democracy Monument, October 1973, leading to the fall of the Thanom dictatorship. *(reclassified C→B 2026-07-13)* |
| 📕 | `fig-b-14` | Phraya Upakitsilpasan | พระยาอุปกิตศิลปสาร (นิ่ม กาญจนาชีวะ) | พระนคร | 13.7470, 100.4900 | Authored "Lak Phasa Thai," standardizing written Thai grammar/orthography instruction; credited with popularizing the modern greeting "sawatdi." |
| 🎯 | `fig-b-11` | Phraya Song Suradej | พันเอกพระยาทรงสุรเดช (เทพ พันธุมเสน) | ดุสิต | 13.7700, 100.5115 | One of the "Four Musketeers" of the 1932 revolution; organized troops that surrounded the Grand Palace. Died in exile in Cambodia. |
| 📗 | `fig-a-09` | Prince Chula Chakrabongse | พระเจ้าวรวงศ์เธอ พระองค์เจ้าจุลจักรพงษ์ | ดุสิต | 13.7700, 100.5160 | Raised/educated in England; wrote extensively in English about Thai royal history, notably "Lords of Life: A History of the Kings of Thailand" (1960). *(reclassified A→B 2026-07-13)* |
| 💃 | `fig-a-11` | Phraya Nattakanurak (Thongdee Suwannabhakdi) | พระยานัฏกานุรักษ์ (ทองดี สุวรรณภารต) | พระนคร | 13.7514, 100.4915 | Headed the royal khon/lakhon corps under the Ministry of the Palace during Rama VI's reign, later folded into the Fine Arts Department. *(reclassified A→B 2026-07-13)* |
| 🏥 | `fig-a-16` | Queen Savang Vadhana | สมเด็จพระพันวัสสาอัยยิกาเจ้า (สว่างวัฒนา) | ดุสิต | 13.7690, 100.5100 | Consort of Rama V; royal patron of the Red Unalom Society. Personally funded a hospital near Bang Phra (1902), smaller than Siriraj. *(reclassified A→B 2026-07-13)* |
| 👸 | `fig-a-19` | Queen Suvadhanā | พระนางเจ้าสุวัทนา พระวรราชเทวี | ดุสิต | 13.7760, 100.5090 | Last royal consort of King Vajiravudh (Rama VI), married 1924; gave birth to Princess Bejaratana the day before the King's death. *(reclassified A→B 2026-07-13)* |
| 🎬 | `fig-b-16` | Ratana Pestonji | ผู้กำกับหนัง รัตน์ เปสตันยี | วัฒนา | 13.7297, 100.5780 | "Father of modern Thai cinema"; cinematographer on "Santi-Vina" (1954), Thailand's first 35mm color film. Screened at Cannes Classics 2016, decades posthumously. |
| 🏗️ | `fig-b-08` | Somdet Chao Phraya Borom Maha Phichaiyat (Tat Bunnag) | สมเด็จเจ้าพระยาบรมมหาพิไชยญาติ (ทัต บุนนาค) | พระนคร | 13.7398, 100.4935 | Senior Bunnag noble; Superintendent of the Royal Warehouse under Rama III, regent under Rama IV. Sponsored the renovation of Wat Phichaiyat (~1829–1832). |
| 👔 | `fig-c-19` | The Bunnag Family | ตระกูลบุนนาค | พระนคร | 13.7420, 100.4940 | Dominated Siamese politics from Rama II to Rama V as successive holders of the Kalahom (Defense) and Krom Tha (Foreign Affairs) ministries. Most powerful noble family in Thai history outside royalty. *(reclassified C→B 2026-07-13)* |
| 🏹 | `fig-b-07` | Thao Thep Krasattri (Chan) and Thao Si Sunthon (Muk) | ท้าวเทพกระษัตรี (จัน) และท้าวศรีสุนทร (มุก) | บางนา | 13.6681, 100.6018 | Widowed sisters who organized the defense of Thalang (Phuket) against a Burmese invasion, 1785, for about a month until it withdrew. Granted "Thao" titles by Rama I. **Note: event is historically in Phuket, ~700km from Bangkok — district tag doesn't reflect real location.** |
| 🍮 | `fig-b-20` | Thao Thong Kip Ma (Marie Guimar) | ท้าวทองกีบม้า (Marie Guimar) | พระนคร | 13.7460, 100.4960 | Portuguese-Japanese royal confectioner of the Ayutthaya court; introduced Portuguese egg-yolk desserts (thong yip, thong yod, foi thong) still made today. |
| 🌸 | `fig-a-14` | Thanpuying Phunsuk Banomyong | ท่านผู้หญิงพูนศุข พนมยงค์ | ปทุมวัน | 13.7350, 100.5470 | Wife of Pridi Banomyong; key member of the Free Thai Movement — sheltered resistance fighters, delivered intelligence. *(reclassified A→B 2026-07-13)* |
| 🌏 | `fig-a-18` | ML Manich Jumsai | หม่อมหลวงมานิจ ชุมสาย | ปทุมวัน | 13.7290, 100.5410 | Author of the most comprehensive series of Thai history books in English (100+ books). *(reclassified A→B 2026-07-13)* |

## Class C — Common (50 pts, 20 figures)

| Emoji | ID | Name (EN) | Name (TH) | District | lat, lng | Description |
|---|---|---|---|---|---|---|
| 🌾 | `fig-c-07` | Ancestors of Bang Na | บรรพบุรุษชุมชนบางนา | บางนา | 13.6590, 100.6130 | Farming/salt-producing communities of Bang Na; Rama IV-era land tenure records document the shift from agriculture to Bangkok's industrial corridor. |
| 🧑 | `fig-c-21` | Ancient Trader | พ่อค้าโบราณ | สุขุมวิท | 13.7360, 100.5590 | Local trader continuing the trading culture of the Sukhumvit area. *(pilot figure for the C-class proximity-capture design, thin content by design)* |
| 🎨 | `fig-c-22` | Art Teacher | ครูสอนศิลป์ | ลาดพร้าว | 13.8120, 100.5880 | Local teacher preserving folk art in the Lat Phrao area. *(pilot figure, same design caveat as Ancient Trader)* |
| 🎣 | `fig-c-01` | Bangkok Fishermen of the Chao Phraya | ชาวประมงบางกอก | พระนคร | 13.7395, 100.5001 | Original inhabitants of Bang Makok; fishermen/traders along the Chao Phraya before Bangkok's founding. |
| 🫙 | `fig-c-12` | Bronze Casters of Wat Ban Bat | ช่างหล่อพระ วัดบ้านบาตร | พระนคร | 13.7529, 100.5069 | Hand-crafted monk's alms bowls for 200+ years, forged from 8 sheet-metal pieces (~20,000 hammer blows each). Only a handful of families remain. |
| 🛣️ | `fig-c-10` | Builders of Bangkok's First Roads | ช่างก่อสร้างถนนสายแรก | ปทุมวัน | 13.7360, 100.5430 | Laborers, many Chinese immigrants, who built New Road (Charoen Krung, 1862), Thailand's first modern road, under Rama IV. |
| 🛶 | `fig-c-08` | Canal Trade Communities (Rama III–IV era) | กลุ่มพ่อค้าเส้นทางคลอง | บางรัก/สีลม | 13.7268, 100.5285 | Merchants who operated Bangkok's canal network when the city was the "Venice of the East," transporting goods before roads existed. |
| 🏮 | `fig-c-16` | Chinese Buddhist Community of Phra Khanong | ชุมชนพุทธจีนในพระโขนง | พระโขนง | 13.7100, 100.5985 | Teochew Chinese community who built the first Chinese temples in Phra Khanong in the late 19th century. |
| 🏮 | `fig-c-02` | Chinese Merchant Families of Yaowarat | พ่อค้าชาวจีนในเยาวราช | พระนคร | 13.7412, 100.4978 | Teochew Chinese merchant community settled under Rama I; built Chinatown (Yaowarat), controlled early Bangkok trade. |
| 🌿 | `fig-c-04` | Dawn Market Vendors of Chatuchak | แม่ค้าตลาดโต้รุ่ง | จตุจักร | 13.7990, 100.5500 | Generations of market vendors at Chatuchak and predecessor markets, preserving rare plants/heirloom seeds/food knowledge. |
| 🚃 | `fig-c-18` | Early Electric Tram Workers | ลูกจ้างรถรางยุคแรก | ปทุมวัน | 13.7300, 100.5490 | Workers of Bangkok's electric tram, inaugurated 1894 — first in Southeast Asia. Shaped early urban geography until buses replaced it, 1968. |
| 🥊 | `fig-b-18` | Khru Nuan Lopburi | ครูนวล ลพบุรี | จตุจักร | 13.8020, 100.5530 | One of three noted Lopburi-style Muay Thai fighters at a royally-sponsored charity tournament, 23 Jul–8 Aug 1921, under Rama VI. *(reclassified B→C 2026-07-13)* |
| 🏺 | `fig-c-06` | Mon Community of Nonthaburi | ชาวมอญในนนทบุรี | นนทบุรี | 13.8621, 100.5144 | Mon people who settled in Nonthaburi after the fall of Pegu; brought distinctive temple architecture, music, ceramics. |
| 🕌 | `fig-c-11` | Muslim Community of Bang Rak | ชุมชนมุสลิมบางรัก | บางรัก/สีลม | 13.7229, 100.5148 | Muslim community along the Chao Phraya in Silom, descendants of Indian Ocean traders; built mosques, ran ports, served as court translators. |
| 🥋 | `fig-c-14` | Muay Thai Teachers of Rama V | ครูมวยไทยสมัยรัชกาลที่ 5 | วัฒนา | 13.7310, 100.5820 | Network of kru muay who maintained training camps during Rama V's reign; methods later formalized at Rajadamnoen Stadium. |
| 🪵 | `fig-c-20` | Palace Carpenters of Rama II | ช่างไม้วังสมัยรัชกาลที่ 2 | พระนคร | 13.7523, 100.4998 | Master carpenters who created the wood-carved doors of Wat Suthat under Rama II's personal supervision, depicting Ramayana scenes. |
| 🔨 | `fig-c-03` | Royal Craftsmen of Rama I | ช่างฝีมือราชสำนักสมัยรัชกาลที่ 1 | พระนคร | 13.7500, 100.4913 | Anonymous artisans — glass-setters, lacquer workers, gold-leaf appliers, wood carvers — who built the Grand Palace and Wat Phra Kaew. |
| 🌳 | `fig-c-17` | Thonburi Orchard Farmers | ชาวสวนกรุงเทพฝั่งธน | พระนคร | 13.7280, 100.4750 | Orchard farmers of Thonburi who cultivated Bangkok's durian/mangosteen/jackfruit orchards, dating to King Taksin's Thonburi Kingdom. |
| 🧵 | `fig-c-05` | Weavers of Ban Krua | ช่างทอผ้าชุมชนบ้านครัว | ปทุมวัน | 13.7448, 100.5302 | Cham Muslim weaving community producing silk/cotton since the late 18th century. Jim Thompson's 1950s discovery launched the Thai silk industry globally. |
| ⛵ | `fig-c-13` | Women of the Floating Markets | ผู้หญิงแห่งตลาดน้ำ | บางกะปิ | 13.7640, 100.6100 | Women vendors who operated Bangkok's floating markets for centuries, paddling sampans along the klongs — the city's original retail economy. |

---

## Districts (`districts` table, 14 rows)

| ID | Thai | Watchtower lat, lng |
|---|---|---|
| `ayutthaya` | อยุธยา | *(null — no single watchtower; multiple lore/support nodes instead)* |
| `bang_kapi` | บางกะปิ | 13.7640, 100.6074 |
| `bang_na` | บางนา | 13.6681, 100.5997 |
| `chatuchak` | จตุจักร | 13.7997, 100.5500 |
| `dusit` | ดุสิต | 13.7716, 100.5132 |
| `ladphrao` | ลาดพร้าว | 13.8136, 100.5765 |
| `nonthaburi` | นนทบุรี | 13.8621, 100.5144 |
| `pathumwan` | ปทุมวัน | 13.7306, 100.5450 |
| `phra_khanong` | พระโขนง | 13.7088, 100.6010 |
| `rattanakosin` | พระนคร | 13.7500, 100.4913 |
| `satit_test` [TEST] | สาธิตประสานมิตร [TEST] | 13.7432, 100.5658 |
| `silom` | บางรัก/สีลม | 13.7283, 100.5268 |
| `sukhumvit` | สุขุมวิท | 13.7445, 100.5605 |
| `watthana` | วัฒนา | 13.7305, 100.5636 — multi-watchtower district; see `watchtowers` table |

### Watchtowers (`watchtowers` table, 1 row — extra towers for multi-tower districts)

| ID | District | Name | lat, lng |
|---|---|---|---|
| `305f2dff-…` | `watthana` | Terminal 21 | 13.7373, 100.5605 |

Watthana has 2 check-in points total: the district-level tower above (Satit PSM area) plus this Terminal 21 row — players must visit both before the district's fog clears fully.

## Support Nodes (`support_nodes` table, 90 rows — cafe/otop/landmark)

| District | Cafés | OTOP | Landmarks |
|---|---|---|---|
| `ayutthaya` | Busaba Cafe & Bake Lab (14.3577,100.5637); BORAN Cafe and Restaurant (14.3573,100.5637) | อยุธยา พาวิลเลียน (14.3560,100.5850) | วัดพระศรีสรรเพชญ์ (14.3559,100.5586); วัดใหญ่ชัยมงคล (14.3453,100.5925); พระราชวังบางปะอิน (14.2325,100.5792) |
| `bang_kapi` | Pacamara Coffee Roasters (13.7522,100.6099); 212 Caffe' Co. (13.7552,100.6201) | OTOP มีนบุรี (13.7810,100.6280) | วัดอุทัยธาราม (13.7740,100.5760); มหาวิทยาลัยรามคำแหง (13.7552,100.6201); ราชมังคลากีฬาสถาน (13.7532,100.6200) |
| `bang_na` | Suvarnabhumi Café (13.6640,100.6200); Nana Coffee Roasters Bangna (13.6680,100.6060); CAFE.HOO (13.6570,100.6020) | OTOP Bang Na (13.6520,100.6070); ตลาดสี่แยกบางนา (13.6730,100.6058) | วัดบางนาใน (13.6580,100.6120); ไบเทค บางนา (13.6682,100.6060); วัดบางนานอก (13.6756,100.5875) |
| `chatuchak` | JJ Market Coffee (13.8000,100.5490); Kaarom Specialty Coffee (13.8020,100.5530) | ตลาดนัดจตุจักร (13.8005,100.5508) | สวนจตุจักร (13.8075,100.5554); ตลาด อ.ต.ก. (13.7971,100.5476); สวนสมเด็จพระนางเจ้าสิริกิติ์ฯ (13.8067,100.5500) |
| `dusit` | ประกายสิริ (13.7750,100.5140); Daily Dose (13.7805,100.5204) | OTOP ของที่ระลึก (13.7780,100.5150) | พระที่นั่งวิมานเมฆ (13.7741,100.5124); วัดเบญจมบพิตร (13.7661,100.5141); สวนสัตว์ดุสิต/เขาดินวนา (13.7718,100.5161) |
| `ladphrao` | BAKEBURY Espresso Bar (13.8150,100.5610); Pacamara Coffee Roasters CentralPlaza (13.8168,100.5560) | OTOP ลาดพร้าว (13.8140,100.5880) | วัดลาดพร้าว (13.8200,100.5910); วัดสิริกมลาวาส (13.8230,100.5970); วัดลาดปลาเค้า (13.8469,100.6046) |
| `nonthaburi` | บ้านท่าน้ำนนท์ (13.8570,100.5100); ชื่นอุรากาแฟ (13.8595,100.5130) | ตลาดนนทบุรี (13.8591,100.5217) | วัดเฉลิมพระเกียรติ (13.8478,100.4842); ศาลากลางฯ หลังเก่า (13.8622,100.5133); วัดเขมาภิรตาราม (13.8217,100.5036) |
| `pathumwan` | True Coffee Siam Sq. (13.7454,100.5326); Mil Toast House (13.7457,100.5343) | นารายณ์ภัณฑ์ (13.7433,100.5491) | ศาลท้าวมหาพรหม (13.7439,100.5406); หอศิลปวัฒนธรรมฯ BACC (13.7467,100.5303); บ้านจิม ทอมป์สัน (13.7492,100.5284) |
| `phra_khanong` | The Wood Land (13.7050,100.6010); Craft Cafe Sukhumvit 71 (13.7090,100.6000) | ตลาดพระโขนง (13.7090,100.6010) | วัดพระโขนง (13.6960,100.5880); วัดธรรมมงคล (13.6877,100.6155); วัดวชิรธรรมสาธิต (13.7050,100.6100); W District/W Market (13.7142,100.5932) |
| `rattanakosin` | Old Town Cafe' Bangkok (13.7480,100.4910); Golden Place Cafe Tha Chang (13.7527,100.4913); Ha Tien Cafe Tha Tien (13.7460,100.4920); Home Cafe Tha Tien (13.7450,100.4920) | OTOP ผ้าไทย (13.7560,100.4980) | วัดพระแก้ว (13.7515,100.4927); พระบรมมหาราชวัง (13.7500,100.4913); วัดโพธิ์ (13.7466,100.4930); มิวเซียมสยาม (13.7444,100.4941); ศาลเจ้าพ่อเสือ (13.7526,100.4977) |
| `satit_test` [TEST] | โรงอาหารสาธิต ฝั่งเหนือ (13.7433,100.5660); คาเฟ่ตึกอาจารย์ (13.7434,100.5656) | ร้านสหกรณ์ มศว (13.7429,100.5659) | ป้ายหน้าโรงเรียนสาธิตประสานมิตร (13.7426,100.5659) |
| `silom` | Rocket Coffeebar Sathorn 12 (13.7227,100.5259); Unicorn Cafe (13.7235,100.5313) | Siam Leather Goods (13.7275,100.5115) | วัดพระศรีมหาอุมาเทวี (13.7243,100.5229); อาสนวิหารอัสสัมชัญ (13.7230,100.5147); ตลาดบางรัก (13.7263,100.5151) |
| `sukhumvit` | The Coffee Club Sukhumvit 23 (13.7375,100.5605); PAGA Microroastery (13.7340,100.5660) | Queen Thai Silk (13.7400,100.5570) | สวนเบญจกิติ (13.7294,100.5596); ศูนย์การประชุมสิริกิติ์ QSNCC (13.7212,100.5553); Cabbages & Condoms (13.7379,100.5580) |
| `watthana` | Roast theCOMMONS Thonglor (13.7275,100.5795); Macchiato Ekkamai 12 (13.7195,100.5850); Roast/D'ARK Piman 49 (13.7305,100.5720) | OTOP ของฝาก Thonglor (13.7310,100.5720) | วัดธาตุทอง (13.7195,100.5855); สวนเบญจสิริ (13.7303,100.5673); Gateway Ekamai (13.7185,100.5858) |

Note: `pathumwan` and `silom` each have one landmark row still tagged with a legacy `node-sukhumvit-*` / `node-silom-*` id prefix from an earlier district split (บ้านจิม ทอมป์สัน, ศาลเจ้าพ่อเสือ) — harmless (the row's `district_id` column is correct), just an id-naming leftover.

## Lore Nodes (`lore_nodes` table, 55 rows — 51 `review_status = 'approved'` as of 2026-07-13, 4 `pending` added 2026-07-14 to `chain-grand-palace-heritage`)

### Standalone district-overview nodes (13, all approved, no chain)

| ID | Name (EN) | District | lat, lng | radius_m | pts |
|---|---|---|---|---|---|
| `lore-bangkapi` | Bang Kapi — Eastern Canal Community | bang_kapi | 13.7640, 100.6074 | 100 | 25 |
| `lore-bangna` | Bang Na — From Rice Fields to Industry | bang_na | 13.6681, 100.5997 | 100 | 25 |
| `lore-chatuchak` | Chatuchak — Legacy of the Green Market | chatuchak | 13.7997, 100.5500 | 150 | 25 |
| `lore-dusit` | Dusit Palace — Symbol of Modern Siam | dusit | 13.7716, 100.5132 | 120 | 35 |
| `lore-ladphrao` | Lat Phrao — Bangkok's First Suburbs | ladphrao | 13.8136, 100.5765 | 120 | 25 |
| `lore-nonthaburi` | Nonthaburi — Mon Heritage and Orchards | nonthaburi | 13.8621, 100.5144 | 120 | 25 |
| `lore-pathumwan` | Lumphini Park — The First Public Park | pathumwan | 13.7306, 100.5450 | 150 | 25 |
| `lore-phrakhanong` | Phra Khanong — Gateway to the Gulf | phra_khanong | 13.7088, 100.6010 | 100 | 25 |
| `lore-silom` | Bang Rak Pier — International Trade Quarter | silom | 13.7283, 100.5268 | 100 | 25 |
| `lore-sukhumvit` | Sukhumvit Road — Symbol of Modernization | sukhumvit | 13.7445, 100.5605 | 120 | 25 |
| `lore-watthana` | Watthana — Where Bangkok Went International | watthana | 13.7305, 100.5636 | 100 | 25 |

*(rattanakosin's district-overview role is filled by the `chain-rattanakosin-founding` chain below instead of a standalone node; `ayutthaya` has no standalone node, only the `chain-ayutthaya-glory` chain.)*

### Chains (10 chains, 40 nodes)

| Chain | District | Status | Parts (in order) |
|---|---|---|---|
| `chain-rattanakosin-founding` | rattanakosin | approved | 1. City Walls of Rattanakosin (13.7526,100.4892,r80,30pt) → 2. The Grand Palace (13.7500,100.4913,r100,40pt) → 3. Wat Phra Kaew (13.7514,100.4925,r100,50pt) |
| `chain-grand-palace-heritage` | rattanakosin | approved (gp-1/gp-4) + pending (gp-2/gp-3/gp-5/gp-6) | 1. The Upper Terrace of Wat Phra Kaew (13.751457,100.492503,r30,60pt) → 2. The Emerald Buddha (13.75145,100.49180,r100,20pt) *pending* → 3. Chakri Maha Prasat Throne Hall (13.75130,100.49175,r100,20pt) *pending* → 4. Queen Sirikit Museum of Textiles (13.7511,100.4903,r60,30pt) → 5. Museum of Wat Phra Kaew (13.75095,100.49215,r100,20pt) *pending* → 6. The Grand Mahamontien Residential Group (13.75155,100.49150,r100,20pt) *pending* — restructured 2026-07-14 from 4 parts to 2 (see note below table), then re-expanded same day with 4 pending nodes pulled verbatim from the Grand Palace Google Doc — awaiting content review before `approved` |
| `chain-1932-revolution` | dusit→rattanakosin→pathumwan | approved | 1. Royal Plaza (13.7697,100.5137,dusit,r100,40pt) → 2. Democracy Monument (13.7567,100.5017,rattanakosin,r80,40pt) → 3. Thammasat University (13.7567,100.4930,pathumwan,r120,50pt) |
| `chain-ayutthaya-glory` | ayutthaya | approved | 1. Wat Phra Si Sanphet (14.3558,100.5581,r120,40pt) → 2. Elephant Duel Battlefield (14.3692,100.5878,r120,50pt) → 3. Wat Yai Chaimongkol (14.3455,100.5924,r120,30pt) |
| `chain-satit-history` [TEST] | satit_test | approved | 1. The Founding of Satit Prasarnmit, 1952–1954 (13.7435,100.5661,r100,25pt) → 2. Becoming Srinakharinwirot University, 1974–2010 (13.7436,100.5655,r100,25pt) → 3. 74 Years On — Sakyavirote Center and Today, 2012–2026 (13.7428,100.5661,r100,30pt) — replaced 2026-07-13 with real school-history content from the official 74th-anniversary infographics |
| `chain-bang-kapi-hua-mak-rise` | bang_kapi | approved | 1. Ramkhamhaeng University (13.7560,100.6180,r120,30pt) → 2. Rajamangala National Stadium (13.7532,100.6200,r120,30pt) |
| `chain-bang-na-gateway-transform` | bang_na | approved | 1. BITEC (13.6682,100.6060,r120,30pt) → 2. Suvarnabhumi Airport (13.6900,100.7501,r150,30pt) |
| `chain-chatuchak-market-evolution` | chatuchak | approved | 1. Chatuchak Weekend Market — Evolution (13.8005,100.5508,r150,30pt) → 2. Or Tor Kor Market (13.7969,100.5502,r120,30pt) |
| `chain-dusit-royal-modernization` | dusit | approved | 1. Vimanmek Mansion (13.7710,100.5077,r120,30pt) → 2. Wat Benchamabophit (13.7563,100.5018,r120,35pt) → 3. Dusit Zoo/Khao Din (13.7725,100.5164,r120,25pt) |
| `chain-ladphrao-canal-orchards-to-mall` | ladphrao | approved | 1. Wat Lat Pla Khao (13.8466,100.6047,r120,25pt) → 2. Central Ladprao (13.8169,100.5600,r120,30pt) |
| `chain-nonthaburi-old-riverside-capital` | nonthaburi | approved | 1. Wat Chaloem Phra Kiat (13.8479,100.4843,r120,30pt) → 2. Museum of Nonthaburi (13.8416,100.4918,r120,25pt) |
| `chain-pathumwan-silk-to-shrine-to-art` | pathumwan | approved | 1. Jim Thompson House (13.7492,100.5283,r120,30pt) → 2. Erawan Shrine (13.7437,100.5409,r100,30pt) → 3. BACC (13.7467,100.5300,r120,25pt) |
| `chain-phrakhanong-canal-legend-chedi` | phra_khanong | approved | 1. Wat Dhammamongkol (13.6881,100.6154,r120,30pt) → 2. Legend of Mae Nak (Wat Mahabut) (13.7144,100.6067,r120,30pt) |
| `chain-silom-faith-quarter` | silom | approved | 1. Sri Maha Mariamman Temple (13.7243,100.5229,r100,30pt) → 2. Assumption Cathedral (13.7231,100.5149,r100,30pt) → 3. Bang Rak Market (13.7195,100.5153,r100,25pt) |
| `chain-sukhumvit-tobacco-to-towers` | sukhumvit | approved | 1. Benjakitti Park (13.7294,100.5586,r150,30pt) → 2. QSNCC (13.7240,100.5592,r150,30pt) |
| `chain-watthana-thonglor-shift` | watthana | approved | 1. Wat That Thong (13.7305,100.5852,r120,30pt) → 2. Benchasiri Park (13.7303,100.5673,r120,25pt) → 3. Gateway Ekamai (13.7185,100.5858,r120,25pt) |

`chain-grand-palace-heritage` is the only chain with 6 parts (rest have 2–3) — `map.js`'s chain-completion check is dynamic (filters by `chain_id`, sorts by `chain_part`), so this needed no code change. Original 3 parts approved 2026-07-13 after content review; restructured to 2 parts 2026-07-14 (merge note above), then re-expanded to 6 parts same day with `lore-gp-2`, `lore-gp-3`, `lore-gp-5`, `lore-gp-6` — content pulled verbatim from the Grand Palace lore Google Doc, inserted with `review_status = 'pending'` (DB default), not yet reviewed/approved.

## BTS/MRT transit bonus zones (`bts_mrt_stations` table, 6 rows, 300m radius each)

| Station | lat, lng |
|---|---|
| Siam BTS | 13.7455, 100.5348 |
| Asok BTS | 13.7370, 100.5604 |
| Mo Chit BTS | 13.8026, 100.5538 |
| Sala Daeng BTS | 13.7286, 100.5341 |
| Sanam Chai MRT | 13.7437, 100.4941 |
| Chatuchak Park MRT | 13.8021, 100.5530 |

Per `CLAUDE.md`, the client-side ×2 transport bonus was removed 2026-07-09 — this table is currently unused by the app.

## Other counts

- `quiz_questions`: 164 rows (was 173 before the mock fixture's 9 rows were deleted with `fig-mock-satit-b-01`).
- All 73 figures now have `lat`/`lng` populated — the old "47 of 74 figures have no coords" fallback-pin situation from the 2026-07-05 snapshot no longer applies.

---

## Appendix: Lore Node Content (`content_th` / `content_en`)

### Standalone district-overview nodes

**`lore-bangkapi`** — Bang Kapi — Eastern Canal Community (bang_kapi)
- TH: บางกะปิในอดีตเป็นชุมชนริมคลองและสวนผลไม้ทางตะวันออกของกรุงเทพฯ ตลาดน้ำบางกะปิเคยเป็นตลาดที่คึกคักที่สุดแห่งหนึ่ง เป็นจุดพักของพ่อค้าที่ขนสินค้าจากจังหวัดภาคตะวันออกเข้าสู่กรุงเทพฯ ตามคลองแสนแสบ
- EN: Bang Kapi was historically a canal-side community and orchard area in Bangkok's east. Its waterway market was one of the busiest transshipment points for goods traveling from the eastern provinces into Bangkok via Saen Saep Canal — a role that shaped its commercial character long before roads replaced the waterways.

**`lore-bangna`** — Bang Na — From Rice Fields to Industry (bang_na)
- TH: บางนาในอดีตเป็นทุ่งนาและนาเกลือที่ทอดยาวถึงชายฝั่งอ่าวไทย ที่ดินของชาวนาที่ถือครองมาตั้งแต่สมัยรัชกาลที่ 4 ค่อยๆ ถูกแปลงเป็นโรงงานและนิคมอุตสาหกรรมหลังสงครามโลกครั้งที่ 2 ถนนบางนา-ตราดเป็นเส้นทางส่งออกสำคัญสู่ท่าเรือแหลมฉบัง
- EN: Bang Na was historically rice paddies and salt flats extending to the Gulf of Thailand coast. Land held by farming families since Rama IV was gradually converted into factories and industrial estates after WWII. The Bang Na–Trat highway became a critical export corridor to the deep-water port at Laem Chabang.

**`lore-chatuchak`** — Chatuchak — Legacy of the Green Market (chatuchak)
- TH: ตลาดจตุจักรมีรากจากตลาดนัดสนามหลวงสมัยรัชกาลที่ 8 ย้ายมายังที่ตั้งปัจจุบัน พ.ศ. 2525 ปัจจุบันเป็นตลาดนัดสุดสัปดาห์ที่ใหญ่ที่สุดในโลก ร้านค้า 15,000 แผง สินค้ากว่า 200,000 รายการ ผู้เข้าชมกว่า 200,000 คนต่อสัปดาห์
- EN: Chatuchak's origins trace to a weekend market at Sanam Luang under Rama VIII before relocating to its current site in 1982. It is now the world's largest weekend market: 15,000 stalls, 200,000 product types, and 200,000 weekly visitors. It remains one of Bangkok's last living repositories of rare heirloom plants and traditional crafts.

**`lore-dusit`** — Dusit Palace — Symbol of Modern Siam (dusit)
- TH: พระราชวังดุสิตสร้างสมัยรัชกาลที่ 5 เพื่อแสดงความเจริญของสยาม พระที่นั่งวิมานเมฆเป็นอาคารไม้สักทองที่ใหญ่ที่สุดในโลก พระที่นั่งอนันตสมาคมสร้างด้วยหินอ่อนจากอิตาลี รัชกาลที่ 5 ใช้วังนี้เป็นสัญลักษณ์ว่าสยามเป็นรัฐที่ทัดเทียมอารยประเทศ
- EN: The Dusit Palace complex was built by Rama V as a modern royal residence symbolizing Siam's progress. Vimanmek Mansion is the world's largest golden teakwood building. The Ananta Samakhom Throne Hall was built from Italian Carrara marble over 8 years. Rama V used Dusit Palace to demonstrate that Siam was a civilized state equal to any European nation.

**`lore-ladphrao`** — Lat Phrao — Bangkok's First Suburbs (ladphrao)
- TH: ลาดพร้าวแปลว่า "ลาดหรือเนินมะพร้าว" ในอดีตเป็นสวนมะพร้าวและสวนผลไม้ที่อุดมสมบูรณ์ริมคลองลาดพร้าว การขุดคลองในสมัยรัชกาลที่ 3 ทำให้ชุมชนเติบโต ต่อมาเป็นย่านที่อยู่อาศัยชั้นกลางของกรุงเทพฯ ยุคใหม่
- EN: Lat Phrao means "slope of coconut palms" — historically a fertile coconut and fruit orchard area along Lat Phrao Canal. The canal was dug primarily during the reign of Rama III, enabling community growth. In the post-war era Lat Phrao became Bangkok's emblematic middle-class residential district, its canals giving way to the arterial roads of modern Bangkok.

**`lore-nonthaburi`** — Nonthaburi — Mon Heritage and Orchards (nonthaburi)
- TH: นนทบุรีเป็นที่ตั้งของชุมชนมอญที่ใหญ่ที่สุดในประเทศไทย ชาวมอญอพยพมาหลายระลอกจากพม่าตั้งแต่สมัยอยุธยา นนทบุรีขึ้นชื่อเรื่องทุเรียนและผลไม้ชั้นเลิศ วัดเฉลิมพระเกียรติวรวิหารสร้างสมัยรัชกาลที่ 3 ยังคงรักษาสถาปัตยกรรมมอญอย่างสมบูรณ์
- EN: Nonthaburi is home to Thailand's largest Mon community. The Mon arrived in waves from Burma from the Ayutthaya period onward. Nonthaburi is renowned for premium durian and tropical fruits. Wat Chaloem Phra Kiat, built in the reign of Rama III, preserves Mon architectural traditions in pristine condition.

**`lore-pathumwan`** — Lumphini Park — The First Public Park (pathumwan)
- TH: สวนลุมพินีเปิดเป็นสมบัติสาธารณะ พ.ศ. 2468 โดยรัชกาลที่ 6 ทรงพระราชทานที่ดินส่วนพระองค์ให้แก่ประชาชน ชื่อ "ลุมพินี" หมายถึงสวนในเนปาลที่พระพุทธเจ้าประสูติ ปัจจุบันเป็นสวนสาธารณะที่ใหญ่ที่สุดในใจกลางกรุงเทพฯ
- EN: Lumphini Park was opened to the public in 1925 by King Rama VI, who donated his private land. Named after the garden in Nepal where the Buddha was born, it is now central Bangkok's largest park. A statue of Rama VI, the park's founder, stands at its southwestern entrance.

**`lore-phrakhanong`** — Phra Khanong — Gateway to the Gulf (phra_khanong)
- TH: พระโขนงเป็นย่านประมงและเกษตรกรรมโบราณที่ปากคลองพระโขนง ซึ่งไหลออกสู่แม่น้ำเจ้าพระยาก่อนถึงอ่าวไทย ชุมชนจีนและไทยอาศัยอยู่ที่นี่มาหลายชั่วอายุคน มีวัดเก่าแก่และตลาดน้ำที่ดำเนินการมาตั้งแต่สมัยรัชกาลที่ 3
- EN: Phra Khanong is an ancient fishing and agricultural community at the mouth of Phra Khanong Canal, which flows into the Chao Phraya before the Gulf of Thailand. Chinese and Thai communities have lived here for generations, with ancient temples and a waterway market operating since the reign of Rama III.

**`lore-silom`** — Bang Rak Pier — International Trade Quarter (silom)
- TH: ย่านสีลม-บางรักในศตวรรษที่ 19 เป็นย่านการค้าที่สำคัญที่สุดของสยาม ท่าเรือเต็มไปด้วยเรือสำเภาจีน เรือกลไฟยุโรป และเรือพ่อค้าจากอินเดียและเปอร์เซีย บริษัทตะวันตกตั้งสำนักงานตามถนนเจริญกรุง ซึ่งเป็นถนนสายแรกของไทย สร้างขึ้น พ.ศ. 2405
- EN: The Silom-Bang Rak area in the 19th century was Siam's most important international trading quarter. The Chao Phraya piers were filled with Chinese junks, European steamships, and vessels from India and Persia. Western trading houses lined Charoen Krung — Thailand's first paved road, built in 1862.

**`lore-sukhumvit`** — Sukhumvit Road — Symbol of Modernization (sukhumvit)
- TH: ถนนสุขุมวิทตั้งชื่อตามพระพิศาลสุขุมวิท อธิบดีกรมทางหลวงคนที่ 5 เปิดใช้งาน พ.ศ. 2479 เป็นแกนหลักการขยายตัวกรุงเทพฯ หลังสงครามโลกครั้งที่ 2 ชุมชนชาวต่างชาติตั้งรกรากตามถนนสายนี้ในทศวรรษ 2500 เปลี่ยนตะวันออกกรุงเทพฯ จากนาข้าวและชุมชนคลองเป็นถนนสายมหานครนานาชาติ
- EN: Sukhumvit Road is named after Phra Bisal Sukhumvit, the fifth Director-General of the Department of Highways, and opened in 1936 as an eastern exit road. After WWII it became Bangkok's main eastward expansion axis. Expatriate communities settled here from the 1950s, transforming the area from farmland into a cosmopolitan corridor.

**`lore-watthana`** — Watthana — Where Bangkok Went International (watthana)
- TH: เขตวัฒนาเติบโตขึ้นในทศวรรษ 2500-2510 เมื่อกองทหารสหรัฐอเมริกาประจำการในไทยช่วงสงครามเวียดนาม ธุรกิจบริการ ร้านอาหาร และบาร์ตามถนนสุขุมวิทตอนกลางขยายตัวอย่างรวดเร็ว ปูทางให้วัฒนากลายเป็นย่านนานาชาติหลักของกรุงเทพฯ
- EN: Watthana grew rapidly in the 1960s–70s as US military personnel stationed in Thailand during the Vietnam War era created demand for international services. Restaurants, bars, and businesses along mid-Sukhumvit expanded dramatically, establishing the district as Bangkok's primary international zone — a character it retains today.

### Chain: `chain-rattanakosin-founding` (rattanakosin, approved)

**Part 1 — `lore-rk-1`** City Walls of Rattanakosin
- TH: ในปี พ.ศ. 2326 รัชกาลที่ 1 ทรงสร้างกำแพงเมืองล้อมรอบพระนครใหม่ ยาวกว่า 7 กิโลเมตร สูง 5 เมตร มีป้อมปราการ 14 แห่ง สร้างโดยแรงงานเชลยศึกเขมรหลายพันคน วัสดุบางส่วนมาจากซากกำแพงอยุธยา
- EN: In 1783 King Rama I built city walls encircling the new capital. The walls stretched over 7 km, stood 5 m high, and featured 14 fortified bastions. They were constructed by thousands of Khmer prisoners of war, with some bricks salvaged from the ruins of Ayutthaya.

**Part 2 — `lore-rk-2`** The Grand Palace
- TH: พระบรมมหาราชวังสร้างขึ้นเมื่อ 6 พฤษภาคม พ.ศ. 2325 พื้นที่กว่า 218,000 ตร.ม. ประกอบด้วยหมู่พระมหามณเฑียร 3 วัง ในช่วงแรกสร้างด้วยไม้ ต่อมาเปลี่ยนเป็นก่ออิฐ รัชกาลที่ 5 ทรงเพิ่มพระที่นั่งจักรีมหาปราสาทซึ่งผสมสถาปัตยกรรมยุโรปและไทย
- EN: The Grand Palace was founded on 6 May 1782 by King Rama I. It covers 218,000 sq m containing three palace compounds. The earliest buildings were wooden, later rebuilt in masonry. Rama V added the Chakri Maha Prasat Throne Hall, blending European and traditional Thai architectural styles.

**Part 3 — `lore-rk-3`** Wat Phra Kaew — Temple of the Emerald Buddha
- TH: วัดพระแก้วสร้างเสร็จปี พ.ศ. 2327 ประดิษฐานพระพุทธมหามณีรัตนปฏิมากร แกะสลักจากหยกก้อนเดียวสูง 66 ซม. ประทับในลาวนาน 214 ปี ก่อนอัญเชิญมากรุงเทพฯ สมัยรัชกาลที่ 1 พระพุทธรูปองค์นี้เป็นปูชนียวัตถุสูงสุดของชาติ
- EN: Wat Phra Kaew was completed in 1784. It enshrines the Emerald Buddha carved from a single jade block, standing 66 cm tall. The image resided in Laos for 214 years before being brought to Bangkok by Rama I. It is considered the palladium of Thailand, with seasonal golden costumes changed personally by the king.

### Chain: `chain-grand-palace-heritage` (rattanakosin, approved)

Restructured 2026-07-14 from 4 parts to 2 — the original 3 upper-terrace nodes (Chedi/Mondop/Emerald Buddha) sat 24–45m apart with r60 each, so all three unlocked from a single standing spot with no walking, and shrinking radius wasn't a real fix (they're that close in real life; typical phone GPS jitter outdoors is ~10-20m, so anything below ~25m risks flaky unlocks). Merged into one "Upper Terrace" node using mystery-box framing — poses a real question, resolved at the museum stop 255m away.

**Part 1 — `lore-gp-1`** The Upper Terrace of Wat Phra Kaew
- TH: บนฐานไพทีแห่งนี้คือกลุ่มอาคารสามหลังที่ต่างยุคต่างรูปแบบกันโดยสิ้นเชิง พระศรีรัตนเจดีย์ทรงลังกาสีทอง พระมณฑปยอดแหลมสำหรับเก็บพระไตรปิฎก และพระอุโบสถซึ่งประดิษฐานพระแก้วมรกต — ทั้งสามสร้างขึ้นคนละรัชกาล คนละแนวคิด แต่สิ่งหนึ่งที่ไม่เคยเปลี่ยนคือ วัดพระศรีรัตนศาสดารามเป็นวัดหลวงเพียงแห่งเดียวในประเทศไทยที่ไม่เคยมีพระภิกษุจำพรรษาอยู่เลยตั้งแต่สร้าง เพราะรัชกาลที่ 1 ทรงประสงค์ให้เป็นเพียงที่ประดิษฐานพระพุทธรูปคู่บ้านคู่เมืองเท่านั้น แล้วใครเล่าที่คอยดูแลรักษาสมบัติและงานฝีมือชั้นสูงของแผ่นดินให้คงอยู่มาสองศตวรรษ?
- EN: This upper terrace holds three structures from three different eras and design philosophies entirely: the golden Ceylonese-style Phra Siratana Chedi, the spired Phra Mondop built to house the Tripitaka, and the ubosot enshrining the Emerald Buddha. Yet one thing has never changed — Wat Phra Kaew is the only royal temple in Thailand that has never had resident monks; Rama I intended it purely as the shrine of the kingdom's most sacred image. So who, then, has kept the kingdom's finest craftsmanship and living traditions alive for two centuries?

**Part 2 — `lore-gp-4`** Queen Sirikit Museum of Textiles
- TH: คำตอบอยู่ในอาคารรัษฎากรพิพัฒน์แห่งนี้ — ไม่ใช่พระสงฆ์ แต่คือช่างฝีมือ ปัจจุบันอาคารเก่าภายในเขตพระบรมมหาราชวังหลังนี้ได้รับการปรับปรุงเป็นพิพิธภัณฑ์ผ้าเมื่อ พ.ศ. 2546 จัดแสดงประวัติศาสตร์สิ่งทอไทยและงานฝีมือช่างทอผ้าจากทั่วประเทศ ผู้ที่รักษามรดกแห่งพระบรมมหาราชวังให้คงอยู่ไม่ใช่ผู้อยู่อาศัย แต่คือผู้สืบทอดฝีมือรุ่นแล้วรุ่นเล่า
- EN: The answer stands in the Ratsadakorn-bhibhathana Building — not monks, but artisans. This historic structure within the Grand Palace grounds was converted into a textile museum in 2003, preserving the history of Thai textiles and the craftsmanship of weavers from across the country. The palace's living heritage was never kept by residents — it was kept by generations of hands who never stopped working.

**Part 3 — `lore-gp-2`** The Emerald Buddha *(pending review, added 2026-07-14, verbatim from Grand Palace lore doc)*
- TH: พระพุทธมหามณีรัตนปฏิมากร หรือพระแก้วมรกต เป็นพระพุทธรูปปางสมาธิ ศิลปะแบบล้านนาตอนปลาย ประทับนั่งขัดสมาธิราบ องค์พระแกะสลักจากเนื้อหยกสีเขียวทึบชิ้นเดียว ขนาดหน้าตักกว้าง 48.3 เซนติเมตร ความสูงจากฐานถึงพระรัศมี 66 เซนติเมตร ประดิษฐานภายในพระบุษบกทองคำเหนือฐานชุกชี ตามประวัติกล่าวว่า ได้พบพระแก้วมรกตที่วัดป่าเยียะเมืองเชียงราย ในปี พ.ศ. 1977 ... (full origin saga: Chiang Rai → Lampang → Chiang Mai → Luang Prabang/Vientiane → Rama I brings it to Bangkok in 1778, enshrined at Wat Phra Kaew; seasonal costume-change tradition established, 3x/year)
- Full `content_th` stored verbatim in DB (~3,300 chars) — not reproduced in full here; see `lore_nodes.content_th` for `lore-gp-2`.

**Part 4 — `lore-gp-3`** Chakri Maha Prasat Throne Hall *(pending review, added 2026-07-14, verbatim from Grand Palace lore doc)*
- TH: เป็นพระที่นั่งแบบผสมผสานระหว่างสถาปัตยกรรมไทยกับสถาปัตยกรรมตะวันตก พระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว ทรงพระกรุณาโปรดเกล้าฯ ให้สถาปนิกชาวอังกฤษจากสิงคโปร์ ชื่อ มิสเตอร์ จอห์น คลูนิช ทำหน้าที่เป็นนายช่างออกแบบถวายตามพระราชดำริ ... (the "ฝรั่งสวมชฎา" compromise story — Western-style hall body with Thai prasat roof spires; completed for the 1882 Rattanakosin centennial)
- Full `content_th` stored verbatim in DB (~2,000 chars) — not reproduced in full here; see `lore_nodes.content_th` for `lore-gp-3`.

**Part 5 — `lore-gp-5`** Museum of Wat Phra Kaew *(pending review, added 2026-07-14, verbatim from Grand Palace lore doc)*
- TH: ในปี พ.ศ. 2522 พระบาทสมเด็จพระมหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร ทรงพระกรุณาโปรดเกล้าฯ ให้สมเด็จพระกนิษฐาธิราชเจ้า กรมสมเด็จพระเทพรัตนราชสุดา ฯ สยามบรมราชกุมารี ทรงเป็นประธานกรรมการอำนวยการปฏิสังขรณ์วัดพระศรีรัตนศาสดารามและพระบรมมหาราชวัง ... museum opened 7 May 1982 for the Bangkok bicentennial; **closed for renovation since 5 Aug 2024 (พ.ศ. 2567), reopening date TBA** — content flags this as current-state-sensitive, worth a freshness check before `approved`.
- Full `content_th` stored verbatim in DB (~2,000 chars) — not reproduced in full here; see `lore_nodes.content_th` for `lore-gp-5`.

**Part 6 — `lore-gp-6`** The Grand Mahamontien Residential Group *(pending review, added 2026-07-14, verbatim from Grand Palace lore doc)*
- TH: หมู่พระมหามณเฑียรเป็นหมู่พระที่นั่งแรกที่สร้างขึ้นในสมัยพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช ในปี พ.ศ. 2325 ประกอบด้วยพระที่นั่งและหอเชื่อมต่อเนื่องกัน 7 องค์ ... (Chakraphat Phiman, Phaisan Thaksin — coronation rites, Phra Sayam Devadhiraj guardian shrine, Amarin Winitchai throne hall)
- Full `content_th` stored verbatim in DB (~3,400 chars) — not reproduced in full here; see `lore_nodes.content_th` for `lore-gp-6`.

### Chain: `chain-1932-revolution` (dusit → rattanakosin → pathumwan, approved)

**Part 1 — `lore-rev-1`** Royal Plaza — Declaration Site
- TH: เช้า 24 มิถุนายน พ.ศ. 2475 พระยาพหลพลพยุหเสนาอ่านประกาศคณะราษฎรที่ลานพระบรมรูปทรงม้า ประกาศยกเลิกสมบูรณาญาสิทธิราชย์ กองกำลังล้อมพระมหาราชวังและควบคุมจุดยุทธศาสตร์ทั่วกรุงเทพฯ โดยไม่มีการยิงปืนแม้แต่นัดเดียว
- EN: On the morning of 24 June 1932, Phraya Phahon read the Declaration of the People's Party at the Royal Plaza, abolishing absolute monarchy. Troops surrounded the Grand Palace and secured strategic points across Bangkok — remarkably, not a single shot was fired during the entire revolution.

**Part 2 — `lore-rev-2`** Democracy Monument
- TH: อนุสาวรีย์ประชาธิปไตยสร้างในปี พ.ศ. 2482 โดย Corrado Feroci (ศิลป์ พีระศรี) ออกแบบให้ปีกสูง 24 เมตร แทนวันที่ 24 มิถุนายน ต่อมากลายเป็นจุดชุมนุมสำคัญในเหตุการณ์ 14 ตุลาคม 2516, 6 ตุลาคม 2519 และการชุมนุมทางการเมืองหลายครั้ง
- EN: The Democracy Monument was built in 1939 by sculptor Corrado Feroci. Its four wings stand 24 m high (for the 24th of June). It later became the focal point of the October 14, 1973 uprising, the October 6, 1976 massacre, and numerous subsequent political protests — the symbolic heart of Thai democracy.

**Part 3 — `lore-rev-3`** Thammasat University
- TH: ปรีดี พนมยงค์ก่อตั้งมหาวิทยาลัยวิชาธรรมศาสตร์และการเมืองในปี พ.ศ. 2477 ให้เป็นมหาวิทยาลัยเปิดสำหรับประชาชนทุกคน ไม่มีการสอบคัดเลือกในช่วงแรก ต่อมากลายเป็นศูนย์กลางขบวนการนักศึกษาปี 2516 และเหตุการณ์ 6 ตุลาคม 2519
- EN: Pridi Banomyong founded the University of Moral and Political Sciences in 1934 as an open-access institution with no entrance exam. This made higher education available to low-income Thais for the first time. The university later became the centre of the 1973 democracy movement and the site of the tragic October 6, 1976 massacre.

### Chain: `chain-ayutthaya-glory` (ayutthaya, approved)

**Part 1 — `lore-ayt-1`** Wat Phra Si Sanphet
- TH: วัดพระศรีสรรเพชญ์เป็นวัดหลวงสำคัญที่สุดของกรุงศรีอยุธยา สร้างขึ้นในรัชสมัยพระบรมไตรโลกนาถ เดิมเคยเป็นที่ประดิษฐานพระพุทธรูปหุ้มทองคำหนักราว 286 ชั่ง แต่ถูกพม่าหลอมละลายในปี พ.ศ. 2310
- EN: Wat Phra Si Sanphet was the most sacred royal temple of Ayutthaya. It once enshrined a gold-covered Buddha statue weighing roughly 286 chang, melted by Burmese forces in 1767.

**Part 2 — `lore-ayt-2`** Elephant Duel Battlefield
- TH: ณ ที่แห่งนี้ สมเด็จพระนเรศวรมหาราชทรงกระทำยุทธหัตถีกับมหาอุปราชาแห่งพม่า เมื่อปี พ.ศ. 2135 ชัยชนะครั้งนั้นทำให้อยุธยาเป็นอิสระจากอำนาจพม่าอีกครั้ง ถือเป็นการรบที่ยิ่งใหญ่ที่สุดในประวัติศาสตร์ไทย
- EN: Here in 1593 CE, King Naresuan defeated Burmese Crown Prince Mingyi Swa in an elephant duel, ending Burmese domination over Ayutthaya and becoming one of the greatest battles in Thai history.

**Part 3 — `lore-ayt-3`** Wat Yai Chaimongkol
- TH: วัดใหญ่ชัยมงคลสร้างขึ้นเพื่อเฉลิมฉลองชัยชนะยุทธหัตถีของสมเด็จพระนเรศวร พระเจดีย์ทรงกลมขนาดใหญ่ตั้งตระหง่านเป็นสัญลักษณ์แห่งความรุ่งเรืองของอยุธยา ก่อนจะถูกทำลายในสงครามปี พ.ศ. 2310
- EN: Wat Yai Chaimongkol was built to celebrate King Naresuan's victory in the elephant duel. Its towering chedi stood as a symbol of Ayutthaya's glory until the Burmese destruction of 1767.

### Chain: `chain-satit-history` [TEST] (satit_test, approved)

Content replaced 2026-07-13 with real milestones from the school's official 74th-anniversary (2569 BE / 2026 CE) infographic set — dates converted from Buddhist Era. Prior 3 nodes were generic placeholder text.

**Part 1 — `lore-satit-1`** The Founding of Satit Prasarnmit (1952–1954)
- TH: โรงเรียนเปิดสอนวันแรกเมื่อวันที่ 3 กรกฎาคม พ.ศ. 2495 รับนักเรียนชั้นมัธยมศึกษาปีที่ 1 รุ่นแรกจำนวน 64 คน มีอาคารเรียน 2 หลัง หนึ่งในนั้นเป็นอาคารหลังคาจากชั้นเดียว ปีถัดมา พ.ศ. 2497 โรงเรียนฝึกหัดครูชั้นสูงได้รับการยกฐานะเป็นวิทยาลัยวิชาการศึกษาประสานมิตร โรงเรียนจึงเปลี่ยนชื่อเป็น "โรงเรียนมัธยมสาธิตวิทยาลัยวิชาการศึกษาประสานมิตร" ย่อว่า ม.ว.ศ.
- EN: The school opened for its first day of classes on 3 July 1952, admitting 64 Mattayom 1 students into two buildings — one a single-storey thatched-roof structure. In 1954 the parent Teacher Training College was elevated to College of Education Prasarnmit, and the school was renamed accordingly, abbreviated ม.ว.ศ.

**Part 2 — `lore-satit-2`** Becoming Srinakharinwirot University (1974–2010)
- TH: พ.ศ. 2517 วิทยาลัยวิชาการศึกษาได้รับการยกฐานะเป็นมหาวิทยาลัยศรีนครินทรวิโรฒ โรงเรียนจึงเปลี่ยนชื่อเป็นโรงเรียนมัธยมสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร ใช้อักษรย่อ ม.ศว. และตราสัญลักษณ์ของมหาวิทยาลัยเป็นตราประจำโรงเรียน ปี พ.ศ. 2539 มีการก่อสร้างอาคารอเนกประสงค์ 8 ชั้น (อาคารวิทยวิโรฒ) งบประมาณกว่า 140 ล้านบาท เปิดใช้อย่างเป็นทางการเมื่อวันที่ 8 ตุลาคม โดยสมเด็จพระกนิษฐาธิราชเจ้า กรมสมเด็จพระเทพรัตนราชสุดาฯ เสด็จเป็นองค์ประธาน ต่อมา พ.ศ. 2553 โรงเรียนเปิดสอนหลักสูตรนานาชาติตามมาตรฐาน Cambridge Assessment International Education เป็นครั้งแรก
- EN: In 1974 the College of Education was elevated to Srinakharinwirot University; the school was renamed accordingly (ม.ศว.) and adopted the university's emblem as its own seal. In 1996 the 8-storey Vitthayavirote multipurpose building was completed at a cost of over 140 million baht, officially opened 8 October with HRH Princess Maha Chakri Sirindhorn presiding as guest of honour. In 2010 the school launched its first International Program under the Cambridge Assessment International Education curriculum.

**Part 3 — `lore-satit-3`** 74 Years On — Sakyavirote Center and Today (2012–2026)
- TH: 9 สิงหาคม พ.ศ. 2555 สมเด็จพระกนิษฐาธิราชเจ้า กรมสมเด็จพระเทพรัตนราชสุดาฯ เสด็จทรงเปิด "ศูนย์ศักยวิโรฒ" ศูนย์ต้นแบบพัฒนาศักยภาพเด็กที่มีความต้องการพิเศษ ควบคู่กับอาคารเฉลิมพระเกียรติ 80 พรรษาฯ ปี พ.ศ. 2565 โรงเรียนริเริ่มรูปแบบการเรียนรู้ไตรภาษาสำหรับชั้น ม.1 พัฒนาทักษะภาษาไทย อังกฤษ และจีนไปพร้อมกัน วันที่ 3 กรกฎาคม พ.ศ. 2569 โรงเรียนครบรอบ 74 ปี แห่งการจัดการศึกษาบนปรัชญา "การศึกษา คือ ความเจริญงอกงาม"
- EN: On 9 August 2012, HRH Princess Maha Chakri Sirindhorn officially opened the Sakyavirote Center, a prototype center for developing the potential of children with special needs, alongside the 80th Birthday Commemorative Building. In 2022 the school pioneered a trilingual learning model for Mattayom 1 students, developing Thai, English, and Chinese in parallel. On 3 July 2026, the school marked 74 years of education under the guiding philosophy 'Education is Growth.'

### Chain: `chain-bang-kapi-hua-mak-rise` (bang_kapi, approved)

**Part 1 — `lore-bk-1`** Ramkhamhaeng University
- TH: มหาวิทยาลัยรามคำแหงก่อตั้งขึ้นตามพระราชบัญญัติปี พ.ศ. 2514 เพื่อรองรับนักเรียนมัธยมที่สอบเข้ามหาวิทยาลัยปิดไม่ได้ เป็นมหาวิทยาลัยรัฐแบบตลาดวิชาแห่งแรกของไทยที่ไม่มีการสอบคัดเลือก เปลี่ยนทุ่งนาหัวหมากให้กลายเป็นศูนย์กลางการศึกษาเปิดกว้างที่ใหญ่ที่สุดของประเทศ
- EN: Ramkhamhaeng University was established under the 1971 Act to absorb secondary graduates shut out of Thailand's limited closed-admission universities. As the country's first open-admission public university with no entrance exam, it transformed the rice paddies of Hua Mak into the nation's largest hub of accessible higher education.

**Part 2 — `lore-bk-2`** Rajamangala National Stadium
- TH: ราชมังคลากีฬาสถานเปิดใช้อย่างเป็นทางการเมื่อวันที่ 6 ธันวาคม พ.ศ. 2541 เพื่อเป็นสนามหลักในการแข่งขันเอเชียนเกมส์ครั้งที่ 13 ที่กรุงเทพฯ เดิมจุผู้ชมได้ถึง 80,000 คน ก่อนลดเหลือราว 49,000-51,000 ที่นั่งหลังปรับปรุงสำหรับศึกฟุตบอลชิงแชมป์แห่งชาติเอเชีย 2007 ปัจจุบันเป็นสนามเหย้าของทีมชาติไทย
- EN: Rajamangala National Stadium officially opened on 6 December 1998 to host the 13th Asian Games in Bangkok. It originally seated 80,000, later reduced to roughly 49,000-51,000 after renovation for the 2007 AFC Asian Cup. It remains the home ground of the Thailand national football team.

### Chain: `chain-bang-na-gateway-transform` (bang_na, approved)

**Part 1 — `lore-bn-1`** BITEC
- TH: ไบเทคเปิดดำเนินการในปี พ.ศ. 2540 บนถนนสุขุมวิท บางนา ด้วยพื้นที่จัดงานรวมกว่า 54,000 ตารางเมตร ทำให้บางนาซึ่งเคยเป็นเพียงพื้นที่เกษตรกรรมชานเมืองกลายเป็นศูนย์กลางการจัดแสดงสินค้าและการประชุมนานาชาติที่ใหญ่ที่สุดแห่งหนึ่งของไทย
- EN: BITEC opened in 1997 on Sukhumvit Road in Bang Na, offering over 54,000 sq m of exhibition space. Its arrival turned Bang Na from suburban farmland into one of Thailand's largest international trade fair and convention hubs.

**Part 2 — `lore-bn-2`** Suvarnabhumi Airport
- TH: ท่าอากาศยานสุวรรณภูมิเปิดให้บริการเที่ยวบินภายในประเทศบางส่วนเมื่อ 15 กันยายน และเปิดเต็มรูปแบบเมื่อ 28 กันยายน พ.ศ. 2549 แทนที่สนามบินดอนเมือง ถนนบางนา-ตราดกลายเป็นเส้นทางหลักเชื่อมกรุงเทพฯ สู่สนามบิน ผลักดันให้บางนากลายเป็นย่านโลจิสติกส์สำคัญของกรุงเทพฯ ตะวันออก
- EN: Suvarnabhumi Airport opened for limited domestic service on 15 September and full operations on 28 September 2006, replacing Don Mueang. The Bang Na-Trat Highway became the primary road link to the airport, turning Bang Na into a key logistics corridor for eastern Bangkok.

### Chain: `chain-chatuchak-market-evolution` (chatuchak, approved)

**Part 1 — `lore-cj-1`** Chatuchak Weekend Market — Evolution
- TH: ตลาดนัดแห่งแรกของกรุงเทพฯ เริ่มขึ้นที่สนามหลวงในปี พ.ศ. 2485 ตามนโยบายของจอมพล ป. พิบูลสงคราม ก่อนย้ายที่หลายครั้ง จนปี พ.ศ. 2525 จึงย้ายมาตั้งถาวรที่สวนจตุจักร และในปี พ.ศ. 2530 มีการสร้างหอนาฬิกาเพื่อฉลองพระชนมพรรษาครบ 60 พรรษาของรัชกาลที่ 9 กลายเป็นสัญลักษณ์หลักของตลาดจนถึงทุกวันนี้
- EN: Bangkok's first flea market began at Sanam Luang in 1942 under Phibunsongkhram's policy, relocating several times before permanently settling at Chatuchak Park in 1982. In 1987 the market's clock tower was built to mark King Bhumibol's 60th birthday, becoming its central landmark ever since.

**Part 2 — `lore-cj-2`** Or Tor Kor Market
- TH: ตลาด อ.ต.ก. เปิดดำเนินการในปี พ.ศ. 2517 โดยองค์การตลาดเพื่อเกษตรกร กระทรวงเกษตรและสหกรณ์ เพื่อช่วยเกษตรกรด้านการตลาดและจำหน่ายผลผลิต ตั้งอยู่ตรงข้ามตลาดนัดจตุจักร ปี พ.ศ. 2560 นิตยสาร CNN จัดอันดับให้เป็นหนึ่งใน 10 ตลาดสดที่ดีที่สุดในโลก
- EN: Or Tor Kor Market opened in 1974, run by the state Marketing Organization for Farmers to help farmers sell produce. Located across from Chatuchak Weekend Market, CNN ranked it in 2017 as one of the world's ten best fresh markets.

### Chain: `chain-dusit-royal-modernization` (dusit, approved)

**Part 1 — `lore-du-1`** Vimanmek Mansion — Construction History
- TH: พระที่นั่งวิมานเมฆสร้างขึ้นในปี พ.ศ. 2443 โดยรื้อพระที่นั่งมันธาตุรัตนโรจน์จากเกาะสีชังมาประกอบใหม่ในสวนดุสิต เปิดใช้เมื่อ 27 มีนาคม พ.ศ. 2444 เป็นอาคารไม้สักทองที่ใหญ่ที่สุดในโลก มี 72 ห้อง รัชกาลที่ 5 ประทับอยู่ 5 ปีก่อนพระที่นั่งอัมพรสถานสร้างเสร็จ
- EN: Vimanmek Mansion was built in 1900 by dismantling the Munthatu Rattanaroj Residence on Ko Sichang and reassembling it in Dusit Garden; inaugurated 27 March 1901. With 72 rooms, it is the world's largest golden teakwood building. Rama V resided there for five years until Amphorn Sathan Hall was completed.

**Part 2 — `lore-du-2`** Wat Benchamabophit — Construction
- TH: วัดเบญจมบพิตรเริ่มก่อสร้างในปี พ.ศ. 2442 ตามพระราชดำริรัชกาลที่ 5 ออกแบบโดยสมเด็จฯ เจ้าฟ้ากรมพระยานริศรานุวัดติวงศ์ ใช้หินอ่อนอิตาลีเป็นวัสดุหลัก ผสานสถาปัตยกรรมไทยกับอิทธิพลตะวันตก พระบรมราชสรีรางคารรัชกาลที่ 5 ประดิษฐานใต้ฐานพระประธานพระอุโบสถ
- EN: Wat Benchamabophit's construction began in 1899 at Rama V's request, designed by Prince Naris and built primarily of Italian marble, fusing Thai temple architecture with Western influence. Rama V's ashes are interred beneath the main Buddha image.

**Part 3 — `lore-du-3`** Dusit Zoo (Khao Din)
- TH: พื้นที่เขาดินวนาเดิมเป็นสวนส่วนพระองค์ของรัชกาลที่ 5 สร้างราวปี พ.ศ. 2438 ปี พ.ศ. 2481 รัฐบาลคณะราษฎรขอพระราชทานพื้นที่เปิดเป็นสวนสัตว์สาธารณะแห่งแรกของไทย บนเนื้อที่ 188,800 ตร.ม. ก่อนปิดถาวรเมื่อ 30 กันยายน พ.ศ. 2561 หลังเปิดมา 80 ปี
- EN: Khao Din Wana was King Chulalongkorn's private garden, created around 1895. In 1938 the constitutional government obtained the land to open Thailand's first public zoo, spanning 188,800 sq m. It permanently closed on 30 September 2018 after 80 years.

### Chain: `chain-ladphrao-canal-orchards-to-mall` (ladphrao, approved)

**Part 1 — `lore-lp-1`** Wat Lat Pla Khao
- TH: วัดลาดปลาเค้าสร้างขึ้นราว พ.ศ. 2409 และได้รับพระราชทานวิสุงคามสีมาในปี พ.ศ. 2435 ชื่อวัดมาจากทำเลที่เคยมีปลาเค้าชุกชุมอยู่ริมที่ราบย่านลาดพร้าวในอดีต
- EN: Wat Lat Pla Khao was founded around 1866 and formally granted temple status in 1892. Its name comes from the once-abundant "pla khao" catfish along this former plain of the Lat Phrao area.

**Part 2 — `lore-lp-2`** Central Ladprao
- TH: ศูนย์การค้าเซ็นทรัลลาดพร้าวเปิดให้บริการเมื่อ 25 ธันวาคม พ.ศ. 2525 นับเป็นศูนย์การค้าครบวงจรแห่งแรกของเครือเซ็นทรัลพัฒนา เปลี่ยนย่านสวนผลไม้ริมคลองให้กลายเป็นย่านการค้าสำคัญของกรุงเทพฯ
- EN: Central Ladprao opened on 25 December 1982 as Central Pattana's first integrated shopping complex, transforming this former canal-side orchard district into a major Bangkok commercial hub.

### Chain: `chain-nonthaburi-old-riverside-capital` (nonthaburi, approved)

**Part 1 — `lore-nb-1`** Wat Chaloem Phra Kiat — Construction History
- TH: รัชกาลที่ 3 โปรดเกล้าฯ ให้สร้างวัดเฉลิมพระเกียรติเมื่อ พ.ศ. 2392 เพื่ออุทิศแด่พระราชมารดา แต่สร้างไม่ทันแล้วเสร็จในรัชกาล จนถึงรัชกาลที่ 4 จึงโปรดให้เจ้าพระยาทิพากรวงศ์ดำเนินการต่อจนแล้วเสร็จในปี พ.ศ. 2401
- EN: King Rama III ordered Wat Chaloem Phra Kiat built in 1849 to honor his mother, Queen Sri Sulalai, but it remained unfinished at his death. Rama IV had Chaophraya Thiphakorawong complete construction in 1858.

**Part 2 — `lore-nb-2`** Museum of Nonthaburi (Old Provincial Hall)
- TH: อาคารศาลากลางจังหวัดนนทบุรีหลังเก่าสร้างด้วยไม้สักทั้งหลังในปี พ.ศ. 2453 ใช้เป็นที่ว่าการจังหวัดตั้งแต่ พ.ศ. 2471 ถึง 2535 ก่อนขึ้นทะเบียนเป็นโบราณสถานปี พ.ศ. 2524 และเปิดเป็นพิพิธภัณฑ์ปี พ.ศ. 2552
- EN: Built entirely of teak wood in 1910, this building served as Nonthaburi's provincial hall from 1928 to 1992. It was registered as a national monument in 1981 and reopened as the Museum of Nonthaburi in 2009.

### Chain: `chain-pathumwan-silk-to-shrine-to-art` (pathumwan, approved)

**Part 1 — `lore-pw-1`** Jim Thompson House — History
- TH: จิม ทอมป์สัน อดีตนายทหารสหรัฐฯ ก่อตั้งบริษัทไทยซิลค์จำกัดในปี พ.ศ. 2491 และสร้างบ้านทรงไทยจากเรือนไม้เก่า 6 หลังขึ้นในปี พ.ศ. 2502 ก่อนหายตัวไปอย่างลึกลับที่มาเลเซียในปี พ.ศ. 2510
- EN: Former US officer Jim Thompson founded the Thai Silk Company in 1948 and built this house from six antique Thai wooden structures in 1959, before mysteriously vanishing in Malaysia in 1967.

**Part 2 — `lore-pw-2`** Erawan Shrine — Origin Story
- TH: ระหว่างก่อสร้างโรงแรมเอราวัณที่เริ่มขึ้นปี พ.ศ. 2496 เกิดอุบัติเหตุและความล่าช้าซ้ำแล้วซ้ำเล่า จึงสร้างศาลท้าวมหาพรหมและอัญเชิญขึ้นประดิษฐานเมื่อ 9 พฤศจิกายน พ.ศ. 2499 หลังจากนั้นการก่อสร้างจึงราบรื่น
- EN: During construction of the Erawan Hotel, begun in 1953, repeated accidents and delays plagued the project. The Erawan Shrine to Phra Phrom (Brahma) was enshrined on 9 November 1956, after which construction proceeded without incident.

**Part 3 — `lore-pw-3`** Bangkok Art and Culture Centre (BACC)
- TH: หลังถูกผลักดันมานานกว่า 17 ปี หอศิลปวัฒนธรรมแห่งกรุงเทพมหานครเปิดให้บริการเมื่อ 29 กรกฎาคม พ.ศ. 2551 ด้วยงบก่อสร้าง 509 ล้านบาท กลายเป็นศูนย์กลางศิลปะร่วมสมัยใจกลางย่านสยาม
- EN: After more than 17 years of advocacy, the Bangkok Art and Culture Centre opened on 29 July 2008 with a construction budget of 509 million baht, becoming a hub for contemporary art in the heart of Siam.

### Chain: `chain-phrakhanong-canal-legend-chedi` (phra_khanong, approved)

**Part 1 — `lore-pk-1`** Wat Dhammamongkol
- TH: วัดธรรมมงคลก่อตั้งขึ้นเมื่อ พ.ศ. 2506 ภายในประดิษฐานพระวิริยะมงคลมหาเจดีย์ ก่อสร้างระหว่าง พ.ศ. 2519-2528 สูง 94.78 เมตร นับเป็นเจดีย์ทรงเจดีย์ที่สูงที่สุดในประเทศไทย
- EN: Wat Dhammamongkol was founded in 1963. Its Phra Viriya Mongkol Maha Chedi, built 1976-1985, rises 94.78 metres — the tallest pagoda-style chedi in Thailand.

**Part 2 — `lore-pk-2`** The Legend of Mae Nak Phra Khanong (Wat Mahabut)
- TH: ตำนานแม่นาคพระโขนงผูกพันกับริมคลองพระโขนงสมัยรัชกาลที่ 4 ศาลแม่นาคตั้งอยู่ที่วัดมหาบุศย์ซึ่งสร้างมาตั้งแต่ พ.ศ. 2305 แต่หลังการปรับเขตปกครองปี พ.ศ. 2540 วัดนี้ตกอยู่ในเขตสวนหลวงแทนเขตพระโขนง (เนื้อเรื่องและวัดมีรากทางประวัติศาสตร์ในพระโขนงแม้เขตปัจจุบันจะเปลี่ยนไป)
- EN: The legend of Mae Nak Phra Khanong is tied to Phra Khanong Canal during Rama IV's reign. Her shrine stands at Wat Mahabut, founded in 1762 — though a 1997 boundary change placed the temple in neighboring Suan Luang district rather than Phra Khanong itself.

### Chain: `chain-silom-faith-quarter` (silom, approved)

**Part 1 — `lore-sl-1`** Sri Maha Mariamman Temple (Wat Khaek)
- TH: วัดฮินดูแห่งนี้สร้างขึ้นในปี พ.ศ. 2422 โดยไวตี ปาไดยาจี พ่อค้าอัญมณีชาวทมิฬที่อพยพจากอินเดียใต้สมัยรัชกาลที่ 5 สถาปัตยกรรมโคปุระสูง 6 เมตรสะท้อนศิลปะทมิฬแบบโจฬะ-ปัลลวะ
- EN: This Hindu temple was built in 1879 by Vaithi Padayatchi, a Tamil gemstone trader who migrated from South India during Rama V's reign. Its 6-metre gopura tower reflects South Indian Chola-Pallava style.

**Part 2 — `lore-sl-2`** Assumption Cathedral
- TH: โบสถ์คาทอลิกหลังแรกสร้างเสร็จปี พ.ศ. 2364 สมัยรัชกาลที่ 2 ตามคำร้องขอของบาทหลวงฝรั่งเศส ปาสกาล ต่อมาสร้างใหม่แบบโรมาเนสก์ระหว่าง พ.ศ. 2453-2461 โดยได้ทุนหลักจากนักธุรกิจคาทอลิกเชื้อสายจีน โลว เกียกเชียง ปัจจุบันเป็นอาสนวิหารหลักของอัครสังฆมณฑลกรุงเทพฯ
- EN: The original Catholic church was completed in 1821 under Rama II, following a request by French missionary Father Pascal. Rebuilt in Romanesque style 1910-1918, largely funded by Chinese-Thai Catholic businessman Low Khiok Chiang. It remains the principal cathedral of the Archdiocese of Bangkok.

**Part 3 — `lore-sl-3`** Bang Rak Market
- TH: ตลาดบางรักก่อตั้งขึ้นสมัยรัชกาลที่ 5 โดยขุนนางหลวงนาวเกนิกร ก่อนขายให้รัฐบาลดูแลต่อ ตั้งอยู่บนถนนเจริญกรุงใกล้ท่าเรือสาทร เคยเป็นศูนย์กลางการค้าของชุมชนพ่อค้าหลากเชื้อชาติในย่านบางรัก
- EN: Bang Rak Market was established during Rama V's reign by nobleman Luang Nawakenikon, who later sold it to the state. Sited on Charoen Krung Road near Sathon Pier, it became a trading hub for Bang Rak's multi-ethnic merchant community.

### Chain: `chain-sukhumvit-tobacco-to-towers` (sukhumvit, approved)

**Part 1 — `lore-sk-1`** Benjakitti Park — From Tobacco Factory to Public Park
- TH: พื้นที่นี้เคยเป็นโรงงานยาสูบของกระทรวงการคลังมานานกว่า 50 ปี ก่อนย้ายออกปี พ.ศ. 2534 ที่ดินถูกพัฒนาเป็นสวนสาธารณะเปิดระยะแรกปี พ.ศ. 2535 ปี พ.ศ. 2549 มีมติขยายสวนเพื่อเฉลิมพระเกียรติสมเด็จพระนางเจ้าสิริกิติ์ฯ ส่วนขยายเปิดสมบูรณ์ปี พ.ศ. 2565
- EN: This land housed the Thailand Tobacco Monopoly's factory for over 50 years. After it relocated in 1991, the site became a public park, first phase opening 1992. A major expansion honoring Queen Sirikit was approved in 2006, fully opening in 2022.

**Part 2 — `lore-sk-2`** Queen Sirikit National Convention Centre (QSNCC)
- TH: สร้างขึ้นระหว่าง พ.ศ. 2532-2534 เพื่อรองรับการประชุมประจำปีธนาคารโลกและ IMF ครั้งที่ 46 ระหว่าง 1-15 ตุลาคม 2534 ก่อสร้างเสร็จเพียง 16 เดือน พระบาทสมเด็จพระเจ้าอยู่หัวและสมเด็จพระนางเจ้าสิริกิติ์ฯ เสด็จเปิดอย่างเป็นทางการเมื่อ 29 สิงหาคม 2534
- EN: Built 1989-1991 specifically to host the 46th Annual Meetings of the World Bank Group and IMF, 1-15 October 1991, completed in just 16 months. King Bhumibol and Queen Sirikit officially opened the centre on 29 August 1991.

### Chain: `chain-watthana-thonglor-shift` (watthana, approved)

**Part 1 — `lore-wt-1`** Wat That Thong — Temple Merger History
- TH: ปี พ.ศ. 2480 รัฐบาลเวนคืนที่ดินวัดหน้าพระธาตุและวัดทองล่างริมแม่น้ำเจ้าพระยาเพื่อสร้างท่าเรือกรุงเทพฯ จึงย้ายเสนาสนะมารวมกันที่ตำบลคลองบ้านกล้วยปี พ.ศ. 2481 โดยสมเด็จพระสังฆราชเจ้า กรมหลวงวชิรญาณวงศ์ทรงเป็นองค์อุปถัมภ์ ตั้งชื่อวัดใหม่จากการรวมชื่อวัดทั้งสองว่า "วัดธาตุทอง"
- EN: In 1937 the government expropriated the riverside land of Wat Na Phra That and Wat Thong Lang to build the Port of Bangkok, moving their structures to Khlong Ban Kluai in 1938. Supreme Patriarch Prince Vajirananavongse sponsored the merger, combining both temples' names into "Wat That Thong."

**Part 2 — `lore-wt-2`** Benchasiri Park
- TH: พื้นที่นี้เคยเป็นที่ตั้งกรมอุตุนิยมวิทยาก่อนย้ายไปบางนา เริ่มก่อสร้างสวนปี พ.ศ. 2533 เปิดอย่างเป็นทางการ 12 สิงหาคม พ.ศ. 2535 เพื่อเฉลิมพระเกียรติสมเด็จพระนางเจ้าสิริกิติ์ฯ ในโอกาสพระชนมพรรษาครบ 5 รอบ ชื่อ "เบญจสิริ" มาจากเบญจ (ห้า) และสิริ (มงคล)
- EN: This site previously housed the Bangkok Meteorological Department before it relocated to Bang Na. Construction began 1990, officially opening 12 August 1992 to honour Queen Sirikit's 60th birthday — "Benjasiri" combines "bencha" (five) and "siri" (auspiciousness).

**Part 3 — `lore-wt-3`** Gateway Ekamai
- TH: ห้างสรรพสินค้าธีมญี่ปุ่นแห่งนี้เปิดตัวเดือนกรกฎาคม พ.ศ. 2555 มีพื้นที่เช่ารวมราว 50,000 ตารางเมตร ร้านค้ากว่า 400 ร้าน เชื่อมต่อสถานีรถไฟฟ้าบีทีเอสเอกมัยโดยตรง สะท้อนการเปลี่ยนผ่านของย่านเอกมัยจากที่อยู่อาศัยสู่แหล่งไลฟ์สไตล์นานาชาติ
- EN: This Japanese-themed mall opened July 2012 with roughly 50,000 sq m of leasable space and around 400 stores, directly connected via skybridge to BTS Ekkamai — emblematic of Ekkamai's shift from residential neighborhood to international lifestyle district.
