# Tamroi (ตามรอย) — Lore & Figure Database + Fact-Check Report

Source: Supabase project `NSC` (`lnvpolwznueiklfgycei`) — tables `public.figures` (74 rows), `public.lore_nodes` (23 rows), `public.support_nodes` (51 rows), `public.history_debates` (2 rows), `public.figure_relations` (8 rows).
Snapshot date: 2026-07-11. Fact-check pass: 2026-07-11, via 8 parallel web-research passes (WebSearch/WebFetch). **Status: APPLIED.** All corrections below (6 fictional-figure replacements, all confirmed factual errors, `bio_th` for 73/74 real figures, 3 lore_node fixes, support_node real-place replacements + wrong-district reassignments) have been written to the live Supabase DB via `apply_migration` on 2026-07-11. Every verdict traces to a source URL; nothing here was written from memory alone, and no name/fact was invented — entries with no verifiable real match were deactivated (`is_active=false`) rather than replaced with an invented name.

**How to read this file:** each figure/lore node/support node has a `**Verdict**` line. Treat `Verified`/`Mostly accurate` as safe to ship as-is (or with the noted tweak). Treat `Likely fictional/unverifiable`, `Inaccurate`, or a flagged wrong-district/wrong-date issue as things that need a decision from the game team before the next content pass.

---

## 0. Top-line summary — what actually needs fixing

**Likely-fictional or unverifiable named figures (7) — recommend removing or replacing:**
| id | Name | Class | Issue |
|---|---|---|---|
| `fig-a-07` | Thanpuying Moli Amataykun | A | No documented person found matching this bio |
| `fig-a-11` | Chalawi Thaiprayoon | A | No documented person found; the UNESCO khon-2018 fact itself is real, just not tied to this name |
| `fig-b-08` | Phraya Phiphat Kosa | B | No sourced link between any real "Phraya Phiphat Kosa" and Wat Pho's construction |
| `fig-b-09` | Dr. Daeng Wirotsiri | B | No record of this person as first Western-trained Thai doctor |
| `fig-b-17` | Phensri Pattanarak | B | No record of this person as first Thai female naval officer |
| `fig-b-18` | Khun Det Achanyut | B | Name reads as generic Muay Thai folklore stock name, not a documented teacher |
| `fig-b-07` | Lady Chan of Thalang | B | Real event (1785 Siege of Thalang), but wrong name ("เนียน ณ ถลาง" — real heroine is "จัน"/Chan), omits her co-heroine sister, and is geographically impossible (Phuket hero placed in Bangkok's `bang_na` district) |

**Confirmed factual errors in figure descriptions (fix text, keep the figure):**
| id | Name | Fix |
|---|---|---|
| `fig-a-16` | Queen Savang Vadhana | Did **not** found Siriraj Hospital (that was Rama V, 1888); she founded the smaller Bang Phra hospital and was patron, not founder, of the Red Cross |
| `fig-a-10` | Phor Suntharaporn | Conflates two different musicians (popular composer Uea Sunthornsanan vs. classical-court "Phraya Pleng" title) under one garbled name |
| `fig-a-20` | Chao Phraya Bhaskarawong | "First Ambassador to UK, 1882" unsupported — his real 1879 role was special envoy, not resident ambassador |
| `fig-a-19` | Queen Suvadhanā | No evidence of a published court-life "memoir" — unsubstantiated |
| `fig-s-18` | Prince Naris | Did not design the original Chakri Maha Prasat spires (that was John Clunis + Rama V/Sri Suriyawong's decision, 1870s–80s); Naris's real involvement was a 1926–1932 restoration |
| `fig-b-15` | Prince Raphi Phatthanathibodi | Wrong given name entirely ("หม่อมเจ้าวิมวาทิตย์" ≠ real prince, whose name is Rapi Phatthanasak); Thai Bar Association co-founding claim unconfirmed |
| `fig-b-16` | Ratana Pestonji | Santi-Vina's Cannes screening was 2016 (after a lost-print rediscovery), not 1954; he was cinematographer, not director |
| `fig-b-14` | Phraya Upakitsilpasan | "1927 Royal Institute dictionary" is anachronistic — Royal Institute wasn't founded until 1933; his real legacy is grammar/orthography texts |
| `fig-c-09` | Bangkok's First Metropolitan Police | Dated 1897; the real first modern British-trained force was **1862** under Rama IV. 1897 was a separate Danish-led provincial gendarmerie |
| `fig-c-12` | Bronze Casters of Wat Ban Bat | Ban Bat bowls are hand-hammered sheet metal, not cast bronze |

**Geographically nonsensical district placements (real figure/place, wrong district):**
| id | Name | Issue |
|---|---|---|
| `fig-b-07` | Lady Chan of Thalang | Phuket hero in Bangkok's `bang_na` |
| `fig-b-10` | Free Thai Movement | No sourced connection to `bang_kapi` |
| `fig-b-19` | Phra Mongkol Thepmuni | Based at Wat Paknam (Phasi Charoen side), not `bang_kapi` |
| support node | Tiger God Shrine (`silom`) | Real shrine is in Phra Nakhon/Rattanakosin, ~3km from Silom |
| support node | Jim Thompson House (`sukhumvit`) | Real house is in Pathumwan (opposite National Stadium), ~3.3km from the Sukhumvit pin |
| support node | "Wat Phra Khanong" (`phra_khanong`) | Doesn't exist under that name; the real Mae Nak-legend temple (Wat Mahabut) is in Suan Luang district |

**Genuinely disputed/legendary history (real controversy — recommend "according to tradition" framing, not flat fact):**
- `fig-s-10` / `lore-ayt-2` **King Naresuan's elephant duel** — Burmese chronicles say Mingyi Swa died by gunfire, not single combat; a Thai historian faced (later-dropped) legal threats in 2013 for publicly disputing it.
- `fig-s-13` **Ramkhamhaeng Inscription** — long-running, unresolved scholarly dispute over whether it (and the "invented the Thai alphabet" narrative) is a 19th-century creation tied to Rama IV.

**Placeholder support-node names (cafes/OTOP) that are not real businesses** — see §3. Real replacements found for most; several honestly could not be matched to any real shop and are flagged "keep as fictional, don't invent a name."

---

## 1. Figures (`figures` table, 74 rows)

Legend: **Verdict** / corrected **birth–death year** (blank in DB today — none of the 74 rows have `birth_year`/`death_year`/`bio_th` filled in) / **Notes** / **Sources**.

### Class S — Legendary (500 pts, 10 figures)

#### fig-s-01 — King Taksin the Great (สมเด็จพระเจ้าตากสินมหาราช) · rattanakosin
**Verdict:** Mostly accurate · **1734–1782**
Reunited Siam after the fall of Ayutthaya (1767), sole king of Thonburi (r. 1767–1782). Description omits that his reign ended in a 1782 coup/execution — not wrong, just incomplete.
Sources: https://en.wikipedia.org/wiki/Taksin · https://en.wikipedia.org/wiki/Thonburi_Kingdom · https://www.britannica.com/biography/Taksin

#### fig-s-09 — Queen Sri Suriyothai (สมเด็จพระศรีสุริโยทัย) · ayutthaya
**Verdict:** Verified · birth unknown–**1548**
Died in 1548 disguised as a warrior, shielding King Maha Chakkraphat from the Burmese viceroy's pursuit.
Sources: https://en.wikipedia.org/wiki/Suriyothai · https://en.wikipedia.org/wiki/Burmese%E2%80%93Siamese_War_(1547%E2%80%931549)

#### fig-s-10 — King Naresuan the Great (สมเด็จพระนเรศวรมหาราช) · ayutthaya
**Verdict:** Disputed/Controversial · **1555–1605**
1593 victory at Nong Sarai and the end of Burmese vassalage are accurate. **The elephant duel itself is historically disputed** — Burmese chronicles say Mingyi Swa died by gunfire; B.J. Terwiel's 2013 review of ~10 primary sources found the formal single-combat duel likely didn't happen as legend tells it. A Thai historian faced (later-dropped) legal action in 2013 for saying so publicly. Recommend "according to tradition" framing in-game.
Sources: https://en.wikipedia.org/wiki/Elephant_duel · https://en.wikipedia.org/wiki/Battle_of_Nong_Sarai · https://www.smithsonianmag.com/smart-news/thailand-drops-charges-against-historian-facts-duel-180967881/

#### fig-s-12 — King Lithai of Sukhothai (ลิไทย) · rattanakosin
**Verdict:** Verified · reigned c. 1347/1355–c. 1374
Authored the *Traiphum Phra Ruang* (c. 1345 CE), oldest surviving Thai literary work. **Data note:** he's a Sukhothai-period king tagged to the `rattanakosin` district — likely a data-placement bug, not a historical error.
Sources: https://en.wikipedia.org/wiki/Trai_Phum_Phra_Ruang · https://en.wikipedia.org/wiki/Maha_Thammaracha_I

#### fig-s-13 — King Ramkhamhaeng the Great (พ่อขุนรามคำแหงมหาราช) · rattanakosin
**Verdict:** Disputed/Controversial · c. 1237/1247–c. 1298
**The Ramkhamhaeng Inscription's authenticity is a genuine, unresolved scholarly dispute** — Piriya Krairiksh and Michael Vickery argued from the late 1980s that the stele (and the "he invented the alphabet" narrative) may be a 19th-century creation tied to Rama IV's legitimizing project. Electron-microscopy dating later supported an older stone, and most historians (e.g. David Wyatt) accept substantial authenticity, but it isn't settled. Recommend "according to tradition" language for the alphabet-invention claim.
Sources: https://en.wikipedia.org/wiki/Ram_Khamhaeng_Inscription · https://www.academia.edu/16392138/

#### fig-s-14 — Somdet Sri Suriyawong (ช่วง บุนนาค) · silom
**Verdict:** Verified · **1808–1883**
Sole regent 1868–1873 during Rama V's minority. Minor: description says he balanced Britain/France/US — US involvement was comparatively marginal; Britain and France were the real pressure.
Sources: https://en.wikipedia.org/wiki/Somdet_Chaophraya_Borom_Maha_Sri_Suriwongse

#### fig-s-16 — Chao Phraya Yomarat (ปั้น สุขุม) · dusit
**Verdict:** Mostly accurate · **1862–1938**
Modernized Bangkok public works (electricity, waterworks, police, cement industry); regent to Rama VIII 1935–1938. "Laid out many of Bangkok's early road systems" is plausible given his Public Works portfolio but not independently confirmed by name in sources found — treat as unverified embellishment.
Sources: https://en.wikipedia.org/wiki/Chaophraya_Yommarat_(Pan_Sukhum)

#### fig-s-17 — Prince Chumphon (กรมหลวงชุมพรเขตอุดมศักดิ์) · silom
**Verdict:** Mostly accurate · **1880–1923**
Modernized the Royal Siamese Navy. "Father of the Royal Thai Navy" was a formal title only conferred in 1993, 70 years after his death — not a contemporary title. "Founded the Naval Cadet School" overstates his role; the academy (est. 1898/opened 1906) predates his most active period, though he's closely tied to its development.
Sources: https://en.wikipedia.org/wiki/Abhakara_Kiartivongse

#### fig-s-18 — Prince Naris (กรมพระยานริศรานุวัดติวงศ์) · rattanakosin
**Verdict:** Partially accurate · **1863–1947**
Designed Wat Benchamabophit (Marble Temple) accurately. **Error:** he did not design the Chakri Maha Prasat tower/spires — that was British architect John Clunis, with the Thai-style-spire decision made by Rama V at regent Sri Suriyawong's urging (1870s–80s). Naris's real spire work was a 1926–1932 *restoration*, not the original design. The "our little brother who knows everything" Rama V quote is widely repeated but couldn't be traced to a primary source.
Sources: https://en.wikipedia.org/wiki/Narisara_Nuwattiwong · https://en.wikipedia.org/wiki/Chakri_Maha_Prasat_Throne_Hall · https://www.academia.edu/42030120/

#### fig-s-19 — Princess Sirindhorn · dusit
**Verdict:** Verified · b. **1955**, living
Maha Chakri title (1977, rare for a woman), Chinese-literature translation work, extensive foundation work — all check out.
Sources: http://kanchanapisek.or.th/biography/sirindhorn/index.en.html · https://en.wikipedia.org/wiki/Sirindhorn

#### fig-s-20 — Prince Damrong Rajanubhab (กรมพระยาดำรงราชานุภาพ) · dusit
**Verdict:** Verified · **1862–1943**
"Father of Thai history," provincial-administration overhaul as Minister of Interior. Founding the "National Museum" specifically is less directly documented than his National Library/Royal Institute credits — minor imprecision.
Sources: https://en.wikipedia.org/wiki/Damrong_Rajanubhab

---

### Class A — Epic (200 pts, 20 figures)

#### fig-a-01 — Sunthorn Phu · rattanakosin
**Verdict:** Verified · **1786–1855**. UNESCO 1986 honor and June 26 Sunthorn Phu Day both check out.
Sources: https://en.wikipedia.org/wiki/Sunthorn_Phu

#### fig-a-02 — Phraya Phahon Phonphayuhasena · dusit
**Verdict:** Mostly accurate · **1887–1947**. Led the "Four Musketeers," 2nd PM 1933–1938, died in poverty (funeral reportedly covered by Phibunsongkhram). Nuance: the manifesto was authored by Pridi Banomyong; Phahon *announced/delivered* it as provisional leader — "read the Declaration" is fine, just not sole-author.
Sources: https://en.wikipedia.org/wiki/Phraya_Phahonphonphayuhasena

#### fig-a-03 — Pridi Banomyong · pathumwan
**Verdict:** Verified · **1900–1983**. Founded Thammasat (1934), led Free Thai Movement, briefly PM 1946, died in Paris exile.
Sources: https://en.wikipedia.org/wiki/Pridi_Banomyong

#### fig-a-04 — Field Marshal Phibunsongkhram · nonthaburi
**Verdict:** Verified · **1897–1964**. Longest-serving PM (1938–44, 1948–57), renamed Siam→Thailand 1939. Minor: "introduced the Western calendar" overstates — Thailand adopted 1 January as year-start in 1941 but kept Buddhist Era numbering, not a full Western-calendar switch.
Sources: https://en.wikipedia.org/wiki/Plaek_Phibunsongkhram

#### fig-a-05 — Chao Phraya Thammasakmontri · dusit
**Verdict:** Mostly accurate · **1876–1943** (death year needs a primary-source double-check). Pioneered vocational/technical education (Uthenthawai School), first President of the National Assembly. "Founder of modern Thai education" overstates — he built on Rama V-era reforms (Prince Damrong et al.), so "leading architect," not sole founder.
Sources: https://www.silpa-mag.com/history/article_33300

#### fig-a-06 — Kulap Saipradit (Sri Burapha) · sukhumvit
**Verdict:** Mostly accurate · **1905–1974**. *Khang Lang Phap* (1937) is real and landmark. Description conflates two separate episodes (imprisonment mid-1950s; exile in China 1958–death 1974) into one "arrested and exiled" line.
Sources: https://en.wikipedia.org/wiki/Kulap_Saipradit

#### fig-a-07 — Thanpuying Moli Amataykun · pathumwan
**Verdict:** ⚠️ Unverifiable/likely fictional. No documented person matching this profile found in English or Thai sources. The real "first girls' school in Bangkok" credit usually goes to missionary-founded schools (Kulasatriwithaya, Wattana Wittaya Academy) — not this name. Recommend removal or replacement pending archival research.

#### fig-a-08 — Seni Pramoj · pathumwan
**Verdict:** Verified · **1905–1997**. Refused to deliver Thailand's WWII declaration of war (25 Jan 1942), 4× PM, co-founded the Democrat Party.
Sources: https://en.wikipedia.org/wiki/Seni_Pramoj

#### fig-a-09 — Prince Chula Chakrabongse · dusit
**Verdict:** Mostly accurate · **1908–1963**. *Lords of Life* (1960) is real and authoritative. **Correction:** his mother was not a "Russian princess" — she was a commoner nursing student from Lutsk (then Russian Empire, now Ukraine), never accorded princess status in Siam.
Sources: https://en.wikipedia.org/wiki/Chula_Chakrabongse

#### fig-a-10 — Phor Suntharaporn (Pradit Phayomyong) · rattanakosin
**Verdict:** ⚠️ Inaccurate — conflates two different people. (1) "Phor Suntharaporn" (Uea Sunthornsanan, 1910–1981) founded Thailand's first Thai-Western fusion pop orchestra (1939) and the Music Association of Thailand — real, but *popular* not *classical* music. (2) "Phraya Pleng"/Luang Pradit Phairoh is a separate hereditary title for *classical* court musicians. "Pradit Phayomyong" as a name doesn't match any documented individual. Recommend splitting into two correctly-named entries or picking one and fixing the framing.
Sources: https://th.wikipedia.org/wiki/เอื้อ_สุนทรสนาน

#### fig-a-11 — Chalawi Thaiprayoon · rattanakosin
**Verdict:** ⚠️ Unverifiable/likely fictional. No documented person found. Note: the description's other fact — Khon inscribed on UNESCO's Intangible Cultural Heritage list in 2018 — is real and correct, just not tied to this name.
Sources (for the UNESCO fact only): https://ich.unesco.org/en/RL/khon-masked-dance-drama-in-thailand-01385

#### fig-a-12 — Admiral Sindhu Kamalanavin · silom
**Verdict:** Partially accurate · b. **1901**. Commanded the RTN through the 1940–41 Franco-Thai War. **Correction:** "minimal naval losses" overstates — the RTN suffered a real defeat at the Battle of Ko Chang (17 Jan 1941), losing the coastal defense ship *Thonburi* and two torpedo boats.
Sources: https://th.wikipedia.org/wiki/หลวงสินธุสงครามชัย_(สินธุ์_กมลนาวิน)

#### fig-a-13 — Phraya Anuman Rajadhon · rattanakosin
**Verdict:** Verified · **1888–1969**. Self-taught founder of Thai folklore studies.
Sources: https://en.wikipedia.org/wiki/Phraya_Anuman_Rajadhon

#### fig-a-14 — Thanpuying Phunsuk Banomyong · pathumwan
**Verdict:** Verified · **1913–2007**. Free Thai Movement, sheltered resistance fighters, imprisoned 1952, cleared her husband's name over decades.
Sources: https://en.wikipedia.org/wiki/Poonsuk_Banomyong

#### fig-a-15 — Phraya Sri Sunthon Wohan (Noi Acharayangkun) · rattanakosin
**Verdict:** Verified · **1822–1891**. Authored *Munlabot Banphakit*, the first systematic Thai grammar textbooks.
Sources: https://en.wikipedia.org/wiki/Phraya_Sisunthonwohan

#### fig-a-16 — Queen Savang Vadhana · dusit
**Verdict:** ⚠️ Partially accurate, contains a real error · **1862–1955**. **Error:** did not found Siriraj Hospital — that was Rama V (1888). She personally funded the smaller Bang Phra hospital (1902, now Queen Savang Vadhana Memorial Hospital) and was royal *patron* (not founder) of the Red Cross Society (est. 1893 by Thai women volunteers, approved by Rama V). "Lived to 93" checks out.
Sources: https://en.wikipedia.org/wiki/Thai_Red_Cross_Society · https://en.wikipedia.org/wiki/Queen_Savang_Vadhana_Memorial_Hospital

#### fig-a-17 — Prince Dhani Nivat · dusit
**Verdict:** Verified · **1885–1974**. One of several Regency Council members in 1946 (not sole regent that year), later did serve as sole/lead regent for Rama IX on other occasions.
Sources: https://en.wikipedia.org/wiki/Dhani_Nivat

#### fig-a-18 — ML Manich Jumsai · pathumwan
**Verdict:** Mostly accurate · **1908–2009**. "Over 100 books" is a commonly repeated but unverified/likely exaggerated figure — soften to "dozens."
Sources: https://openlibrary.org/authors/OL703660A/

#### fig-a-19 — Queen Suvadhanā · dusit
**Verdict:** Partially accurate · **1905–1985**. Last consort of Rama VI, mother of Princess Bejaratana. **No evidence found** of a published court-life memoir — this claim is unsubstantiated; her documented later-life activity was Red Cross/charity work, not writing.
Sources: https://en.wikipedia.org/wiki/Suvadhana

#### fig-a-20 — Chao Phraya Bhaskarawong · silom
**Verdict:** Partially accurate · **1849–1920**. **Correction:** "first Ambassador to UK (1882)" is not supported by sources — his documented 1879 role was special envoy (ราชทูตพิเศษ), not resident ambassador; Thailand's first titled ambassador to the UK is usually dated 1892.
Sources: https://en.wikipedia.org/wiki/List_of_ambassadors_of_Thailand_to_the_United_Kingdom

---

### Class B — Rare (100 pts, 20 figures + 1 test fixture)

#### fig-b-01 — Chao Phraya Surasak Montri · dusit
**Verdict:** Mostly accurate · **1852–1931**. Led 1880s campaigns against Chinese Haw rebel bands in Lao-frontier principalities — "Shan states" is imprecise (those campaigns targeted Lao-frontier Haw bands, not Burma's Shan States).
Sources: https://th.wikipedia.org/wiki/เจ้าพระยาสุรศักดิ์มนตรี_(เจิม_แสง-ชูโต)

#### fig-b-02 — Prince-Patriarch Vajiranana Varorasa · rattanakosin
**Verdict:** Mostly accurate · **1860–1921**. Reformed the Sangha, founded Mahamakut Buddhist Academy. "First standardized Pali-Thai dictionary" unconfirmed — his real works were Pali grammar textbooks/curricula.
Sources: https://th.wikipedia.org/wiki/สมเด็จพระมหาสมณเจ้า_กรมพระยาวชิรญาณวโรรส

#### fig-b-03 — Chao Phraya Ram Raghob · dusit
**Verdict:** Mostly accurate · **1890–1967**. Youngest-ever Chao Phraya, head of Rama VI's royal household. No corroborating source for "letters documenting palace political debates" — unverified embellishment.
Sources: https://th.wikipedia.org/wiki/เจ้าพระยารามราฆพ_(หม่อมหลวงเฟื้อ_พึ่งบุญ)

#### fig-b-04 — Khun Wichitmatra · rattanakosin
**Verdict:** Mostly accurate · **1897–1980**. Wrote *Lak Thai*, early Thai film director. "Director of Fine Arts" title unconfirmed — sources describe him as government translator/civil servant, not head of the department.
Sources: https://th.wikipedia.org/wiki/ขุนวิจิตรมาตรา_(สง่า_กาญจนาคพันธุ์)

#### fig-b-05 — Prof. Puey Ungphakorn · pathumwan
**Verdict:** Mostly accurate · **1916–1999**. Bank of Thailand governor 1959–71, resigned as Thammasat rector the night of the 6 Oct 1976 massacre, fled to UK exile. The specific essay title/1973 date given couldn't be independently confirmed (his best-known works are "จากครรภ์มารดาถึงเชิงตะกอน" and a 1976 open letter).
Sources: https://en.wikipedia.org/wiki/Puey_Ungphakorn

#### fig-b-06 — MR Kukrit Pramoj · silom
**Verdict:** Mostly accurate · **1911–1995**. PM 1975–76, founded Siam Rat, *Four Reigns* is real (serialized ~1950/1953).
Sources: https://en.wikipedia.org/wiki/Kukrit_Pramoj

#### fig-b-07 — Lady Chan of Thalang · bang_na
**Verdict:** ⚠️ Inaccurate — name wrong, event misattributed to one person, district nonsensical. Real heroine of the 1785 Siege of Thalang (Phuket) was **Than Phuying Chan** ("จัน" — not "เนียน ณ ถลาง," which doesn't match any source), later honored as Thao Thep Krasattri, alongside her **sister** Khun Muk (Thao Si Sunthon) — the game's version drops the sister entirely. Geographically: Thalang is in Phuket, ~700km from Bangkok; placing her in `bang_na` (a Bangkok district) makes no sense. Recommend fixing the name, adding the sister, and either dropping the district tag or moving her to an "external/legendary figures" category outside the Bangkok district system.
Sources: https://en.wikipedia.org/wiki/Thao_Thep_Krasattri_and_Thao_Si_Sunthon

#### fig-b-08 — Phraya Phiphat Kosa · rattanakosin
**Verdict:** ⚠️ Likely fictional/unverifiable. No source ties any real holder of the "Phiphat Kosa" title to Wat Pho's Rama III-era renovation. The only documented "Phraya Phiphat Kosa" found is a Rama V/VI-era court official unrelated to architecture. Recommend removal or replacement.

#### fig-b-09 — Dr. Daeng Wirotsiri · pathumwan
**Verdict:** ⚠️ Likely fictional/unverifiable. No record found of this name as "Thailand's first Western-trained doctor" or a Siriraj co-founder. Recommend replacing with a documented figure (e.g. Prince Wongsa Dhiraj Snid, "the Doctor Prince").

#### fig-b-10 — Free Thai Movement · bang_kapi
**Verdict:** Mostly accurate as a movement description. "Treated as a liberated nation" overstates — Thailand avoided formal defeated-Axis status but still made war-reparation concessions. No sourced connection to `bang_kapi` district — placement appears arbitrary.
Sources: https://en.wikipedia.org/wiki/Free_Thai_Movement

#### fig-b-11 — Phraya Song Suradej · dusit
**Verdict:** Mostly accurate · **1892–1944**. One of the Four Musketeers, chief strategist of the 1932 coup (not specifically the one "who organized the troops that surrounded the palace" — that's more Phahon/Phibun's role). Died in Japanese-occupied Cambodia/Indochina, 1944.
Sources: https://th.wikipedia.org/wiki/พระยาทรงสุรเดช_(เทพ_พันธุมเสน)

#### fig-b-12 — Supreme Patriarch Vasana · rattanakosin
**Verdict:** Mostly accurate · **1897–1988**. 18th Supreme Patriarch, 1974–1988.
Sources: https://thammapedia.com/sankha/sangharaja_18.php

#### fig-b-13 — Silpa Bhirasri (Corrado Feroci) · pathumwan
**Verdict:** Verified · **1892–1962**. Founded Silpakorn University (1943), designed Democracy Monument (1939–40) and Victory Monument.
Sources: https://www.italianartsociety.org/2017/05/

#### fig-b-14 — Phraya Upakitsilpasan · rattanakosin
**Verdict:** Partially accurate · **1879–1941**. **Correction:** "Royal Institute's first standardized Thai dictionary (1927)" is anachronistic — the Royal Institute wasn't founded until 1933, its first dictionary published 1950. His real, verified legacy is grammar/orthography standardization (หลักภาษาไทย), not dictionary authorship.
Sources: https://th.wikipedia.org/wiki/พระยาอุปกิตศิลปสาร_(นิ่ม_กาญจนาชีวะ)

#### fig-b-15 — Prince Raphi Phatthanathibodi · dusit
**Verdict:** ⚠️ Partially accurate — name wrong. **Correction:** the real "Father of Thai Law" is Prince Rabi Bodhanabaya / Rapi Phatthanasak (พระเจ้าบรมวงศ์เธอ กรมหลวงราชบุรีดิเรกฤทธิ์), a direct son of Rama V ranked "Phra Chao Boromawongse Ther" — not "หม่อมเจ้าวิมวาทิตย์" (a lower Mom Chao rank that doesn't match any source). Founded the Law School (1897); Thai Bar Association co-founding claim (Bar Assoc. est. 1914) is unconfirmed.
Sources: https://th.wikipedia.org/wiki/พระเจ้าบรมวงศ์เธอ_กรมหลวงราชบุรีดิเรกฤทธิ์

#### fig-b-16 — Ratana Pestonji · watthana
**Verdict:** Partially accurate · **1908–1970**. Father of modern Thai cinema. **Correction:** *Santi-Vina*'s Cannes screening happened in **2016** (Cannes Classics, after the print was rediscovered/restored 2014–15) — not 1954, 46 years after his death. Its real 1954 milestone was the Tokyo Asia-Pacific Film Festival. Also: he was the film's cinematographer, not its director (Thavi Na Bangchang directed).
Sources: https://en.wikipedia.org/wiki/Rattana_Pestonji · https://en.wikipedia.org/wiki/Santi-Vina

#### fig-b-17 — Phensri Pattanarak · pathumwan
**Verdict:** ⚠️ Likely fictional/unverifiable. No record found; a different, later Royal Thai Navy officer (Cdr. Mayuree Bunyarattaphan) is the documented "early female officer" figure, in a different era. Recommend removal or replacement.

#### fig-b-18 — Khun Det Achanyut · chatuchak
**Verdict:** ⚠️ Likely fictional/unverifiable. No record found; documented Lopburi-style teachers of the era are named Khru Nuan Lopburi, Nai Siw Okphet, Nai Ae Prachamkarn. "ขุนเดช อาชาญยุทธ" reads as a generic/stock heroic name from Thai boxing folklore, not a documented individual. Recommend replacing with Khru Nuan Lopburi.

#### fig-b-19 — Phra Mongkol Thepmuni (Luang Pu Sodh) · bang_kapi
**Verdict:** Verified · **1884–1959**. Developed Dhammakaya meditation at Wat Paknam. Data note: Wat Paknam is on the Phasi Charoen/Thonburi side, not `bang_kapi` — district link is unclear.
Sources: https://watluangphorsodh.org/

#### fig-b-20 — Thao Thong Kip Ma (Marie Guimar) · rattanakosin
**Verdict:** Mostly accurate · c. 1664–c. 1728 (dates disputed). Royal confectioner, popularized thong yip/thong yod/foi thong. Genuine historiographical controversy: some food historians dispute she personally invented these desserts, since Portuguese communities had lived in Ayutthaya 150+ years before her — worth a footnote in-game.
Sources: https://th.wikipedia.org/wiki/ท้าวทองกีบม้า_(มารี_กีมาร์)

#### fig-mock-satit-b-01 — Satit Pioneer [MOCK/TEST]
Not a real historical figure — explicit QA fixture (marked `[TEST]` in its own Thai text). Flag for removal before production data cleanup, as previously noted.

---

### Class C — Common (50 pts, 22 figures)

Most Class C entries are composite/collective folk categories, not named individuals — verdicts assess whether the underlying historical phenomenon is accurate.

| id | Name | Verdict | Notes / correction |
|---|---|---|---|
| `fig-c-01` | Bangkok Fishermen of the Chao Phraya | Mostly accurate | "Bang Makok" etymology (olive-plum tree) is real; pre-1782 riverine trading community well attested |
| `fig-c-02` | Chinese Merchant Families of Yaowarat | Mostly accurate | Teochew settlement under Rama I (1782) is correct; but "Yaowarat" as a named road/district dates to **Rama V (1892)**, not Rama I — minor date conflation |
| `fig-c-03` | Royal Craftsmen of Rama I | Generic, sound premise | Grand Palace/Wat Phra Kaew built 1782 by conscripted/court artisans — not in dispute |
| `fig-c-04` | Dawn Market Vendors of Chatuchak | Partially accurate | Market's real lineage is 1942 (Phibunsongkhram-era Sanam Luang flea market)→1982 relocation — an ~80-year institution, not ancient |
| `fig-c-05` | Weavers of Ban Krua | Verified | Cham Muslim community settled 1787; Jim Thompson sourced their silk from 1948, launching Thai silk globally |
| `fig-c-06` | Mon Community of Nonthaburi | Verified | Mon refugees fled Pegu's fall (1539, 1757), settled Pak Kret/Nonthaburi |
| `fig-c-07` | Ancestors of Bang Na | Generic, plausible | No specific claim to verify |
| `fig-c-08` | Canal Trade Communities (Rama III–IV) | Verified | Canal network expansion under Rama III/IV and "Venice of the East" nickname both real |
| `fig-c-09` | Bangkok's First Metropolitan Police | ⚠️ Partially accurate | **Correction:** first modern British-trained force was **1862** (Capt. Samuel Ames), not 1897. 1897 was a separate, Danish-led provincial gendarmerie under Prince Damrong |
| `fig-c-10` | Builders of Bangkok's First Roads | Verified | Charoen Krung ("New Road") construction began 1862, opened 1864 — matches |
| `fig-c-11` | Muslim Community of Bang Rak | Verified | Early-19th-century Indian Ocean-trader community; Haroon Mosque built 1837 |
| `fig-c-12` | Bronze Casters of Wat Ban Bat | ⚠️ Mostly accurate | **Correction:** bowls are hand-hammered/forged sheet metal (8 pieces, ~20,000 hammer blows), not cast bronze. "200+ years" (founded ~1780s–1800s) checks out |
| `fig-c-13` | Women of the Floating Markets | Mostly accurate | Real tradition; best-documented floating markets (Damnoen Saduak) are more Thonburi-area than specifically Bang Kapi |
| `fig-c-14` | Muay Thai Teachers of Rama V | Mostly accurate | Rama V-era kru muay tradition real; but Rajadamnern Stadium (the "formalization") wasn't built until 1941–45, a 30+ year gap not stated in-game |
| `fig-c-15` | October Student Movement Members | Verified | 14 Oct 1973 uprising, 77 deaths, fall of Thanom regime — well documented |
| `fig-c-16` | Chinese Buddhist Community of Phra Khanong | Partially accurate | Canal-side Chinese settlement plausible (canal excavated 1837–40); specific "first Chinese temples, late 19th c." claim unconfirmed |
| `fig-c-17` | Thonburi Orchard Farmers | Verified | Fruit-growing tradition tracing to Taksin's era (1767–82) well documented |
| `fig-c-18` | Early Electric Tram Workers | Verified | Electrified 1894, first in Asia; ended 1968 — both match |
| `fig-c-19` | The Bunnag Family | Verified | Persian-origin (Sheikh Ahmad, c. 1600), held Kalahom/Krom Tha offices Rama II–V |
| `fig-c-20` | Palace Carpenters of Rama II | Verified | Wat Suthat door-carving under Rama II's personal supervision is documented |
| `fig-c-21` | Ancient Trader | Generic flavor-text | No specific claim to verify |
| `fig-c-22` | Art Teacher | Generic flavor-text | No specific claim to verify |

Sources for the table: https://en.wikipedia.org/wiki/History_of_Bangkok · https://en.wikipedia.org/wiki/Chinatown,_Bangkok · https://www.chatuchakmarket.org/history-of-chatuchak-market/ · https://www.nationthailand.com/life/art-culture/40037570 · https://thesiamsociety.org/wp-content/uploads/2010/03/JSS_098_0g_VanRoy_SafeHavenMonRefugeesAtCapitalsOfSiam.pdf · https://en.wikipedia.org/wiki/Royal_Thai_Police · https://en.wikipedia.org/wiki/Charoen_Krung_Road · https://myrehat.com/places-to-explore/bang-rak-district-a-must-visit-gem-for-muslim-travellers-in-bangkok/ · https://en.wikipedia.org/wiki/Ban_Bat · https://en.wikipedia.org/wiki/Rajadamnern_Stadium · https://en.wikipedia.org/wiki/1973_Thai_popular_uprising · https://www.yearofthedurian.com/2016/05/history-durian-thailand.html · https://en.wikipedia.org/wiki/Trams_in_Bangkok · https://en.wikipedia.org/wiki/Bunnag_family · https://en.wikipedia.org/wiki/Wat_Suthat

---

## 2. Lore nodes (`lore_nodes` table, 23 rows)

#### lore-ayt-1 — Wat Phra Si Sanphet (ayutthaya)
**Verdict:** Partially accurate. 1767 destruction/gold-melting is correct. **"171 chang" doesn't match sourced figures** — the chronicle tradition cites ~286 chang for the gold gilding; 171 looks like a kg-vs-chang unit conflation. Recommend correcting to ~286 chang or clarifying units.
Sources: https://en.wikipedia.org/wiki/Wat_Phra_Si_Sanphet

#### lore-ayt-2 — Elephant Duel Battlefield (ayutthaya)
**Verdict:** Mostly accurate, same caveat as fig-s-10 above — the duel itself is disputed history, date (1593) and outcome are correct.
Sources: https://en.wikipedia.org/wiki/Battle_of_Nong_Sarai

#### lore-ayt-3 — Wat Yai Chaimongkol (ayutthaya)
**Verdict:** Mostly accurate. Chedi built 1592, destroyed with the rest of Ayutthaya in 1767.
Sources: https://en.wikipedia.org/wiki/Wat_Yai_Chai_Mongkhon

#### lore-bangkapi (bang_kapi)
**Verdict:** Mostly accurate. Sits on Khlong Saen Saep (built 1837–40, Rama III); orchard/canal trade real. "One of the busiest transshipment points" is plausible color, not a hard-sourced superlative.
Sources: https://en.wikipedia.org/wiki/Khlong_Saen_Saep

#### lore-bangna (bang_na)
**Verdict:** Partially accurate. General rice-fields→industry framing matches known patterns, but "salt flats" and "farming families since Rama IV" specifics are unverified embellishments for Bang Na specifically.

#### lore-chatuchak (chatuchak)
**Verdict:** Mostly accurate. Sanam Luang origins and 1982 relocation are correct. "200,000 product types" figure couldn't be corroborated — reads as a rounded promotional claim; "15,000 stalls"/"200,000 weekly visitors" are consistent with commonly cited tourism stats.
Sources: https://www.chatuchakmarket.org/history-of-chatuchak-market/

#### lore-dusit — Dusit Palace (dusit)
**Verdict:** Verified. Vimanmek = world's largest golden teakwood building (confirmed); Ananta Samakhom Throne Hall commissioned 1907, completed 1915 (exactly 8 years), Italian Carrara marble — all match exactly.
Sources: https://en.wikipedia.org/wiki/Dusit_Palace · https://en.wikipedia.org/wiki/Vimanmek_Mansion

#### lore-rev-1 — Royal Plaza Declaration Site (dusit)
**Verdict:** Verified. 24 June 1932, Phahon read the manifesto, bloodless coup — matches.
Sources: https://en.wikipedia.org/wiki/Siamese_revolution_of_1932

#### lore-ladphrao (ladphrao)
**Verdict:** ⚠️ Factual error. **Correction:** Khlong Lat Phrao was dug primarily under **Rama III** (for a campaign against Vietnamese forces), not Rama V as the node currently states.
Sources: https://en.wikipedia.org/wiki/Lat_Phrao_district

#### lore-nonthaburi (nonthaburi)
**Verdict:** Mostly accurate. Mon community real and long-established (though "largest in Thailand" is an unverifiable superlative — Pathum Thani/Sam Khok also have major Mon populations). Wat Chaloem Phra Kiat begun 1849 under Rama III, completed 1858 under Rama IV — "reign of Rama III" is accurate for the founding.
Sources: https://en.wikipedia.org/wiki/Wat_Chaloem_Phra_Kiat_Worawihan

#### lore-pathumwan — Lumphini Park (pathumwan)
**Verdict:** Verified. Rama VI donated 360 rai in 1925; named after the Buddha's Nepali birthplace.
Sources: https://en.wikipedia.org/wiki/Lumphini_Park

#### lore-rev-3 — Thammasat University (pathumwan)
**Verdict:** Verified. Founded 27 June 1934 by Pridi, open-admission (until 1960), site of 1973 uprising and 1976 massacre.
Sources: https://en.wikipedia.org/wiki/Thammasat_University

#### lore-phrakhanong (phra_khanong)
**Verdict:** Mostly accurate. Khlong Phra Khanong widened 1840 under Rama III — matches "since the reign of Rama III" framing.
Sources: https://en.wikipedia.org/wiki/Khlong_Phra_Khanong

#### lore-rev-2 — Democracy Monument (rattanakosin)
**Verdict:** Partially accurate. 1939, four wings 24m high — correct. **Correction:** Corrado Feroci sculpted the **relief panels**, but the monument's overall **architect was Mew Aphaiwong** (built by Christiani & Nielsen) — "built by sculptor Corrado Feroci" overstates his role.
Sources: https://en.wikipedia.org/wiki/Democracy_Monument

#### lore-rk-1 — City Walls of Rattanakosin (rattanakosin)
**Verdict:** Mostly accurate. 1783, ~7km, 14 bastions, Ayutthaya-salvaged bricks — all check out. "Khmer POWs" simplifies the labor force (Lao laborers were also heavily involved). Height "5m" is at the high end of the 4–5m range cited across sources.
Sources: https://en.wikipedia.org/wiki/Fortifications_of_Bangkok

#### lore-rk-2 — The Grand Palace (rattanakosin)
**Verdict:** Verified. Founded 6 May 1782, 218,400 sq m (matches "218,000"), three courts, Chakri Maha Prasat added under Rama V (completed 1882).
Sources: https://en.wikipedia.org/wiki/Grand_Palace

#### lore-rk-3 — Wat Phra Kaew (rattanakosin)
**Verdict:** Mostly accurate. Completed 1784–85 (most sources say 1785, so "1784" is close but slightly early). Emerald Buddha 66cm, single jade/nephrite block, 214 years in Vientiane before Rama I brought it in 1779 — all precisely match.
Sources: https://en.wikipedia.org/wiki/Emerald_Buddha

#### lore-satit-1 / -2 / -3 — Prasarnmit / SWU chain (satit_test) [TEST district]
**Verdict:** Part 1 verified (founded 1949 by Dr. Saroj Buasri). Part 2 partially accurate: 1974 renaming to Srinakharinwirot under Rama IX is correct, **but** the "unified colleges of education nationwide" framing is wrong (SWU formed from Prasarnmit's own college; regional branches later became *separate* universities — Naresuan, Mahasarakham, Burapha, Thaksin — rather than unifying), and the "name honors Princess Srinagarindra" etymology is an unverified folk claim not found in official sources. Part 3 verified as a real institution, no specific claim to check.
Sources: https://en.wikipedia.org/wiki/Srinakharinwirot_University

#### lore-silom — Bang Rak Pier (silom)
**Verdict:** Verified. 19th-century international trading quarter real; Charoen Krung construction 1862, opened 1864.
Sources: https://en.wikipedia.org/wiki/Charoen_Krung_Road

#### lore-sukhumvit — Sukhumvit Road (sukhumvit)
**Verdict:** ⚠️ Inaccurate. Road opened 1936 — correct. **Correction:** it's named after **Phra Bisal Sukhumvit**, 5th Director-General of the Department of Highways — not "Phraya Sukhumnaiwinit, Bangkok's first governor," a name/title not supported by any source found.
Sources: https://en.wikipedia.org/wiki/Sukhumvit_Road · https://en.wikipedia.org/wiki/Phra_Bisal_Sukhumvit

#### lore-watthana (watthana)
**Verdict:** Verified. 1960s–70s Vietnam-War-era US military R&R demand shaped the area — well documented, even though Watthana wasn't a separate administrative district until 1998.
Sources: https://kyoto-seas.org/pdf/39/2/390201.pdf

### Debate citations (`history_debates`, 2 rows)
Both entries cite real, accurately-characterized publications:
- **fig-s-10** debate cites the *Luang Prasoet Chronicle* (real 1681 primary source, terse style often cited by duel-skeptics) and Lieberman's *Strange Parallels* (Cambridge UP, real).
- **fig-s-09** debate cites Baker & Phongpaichit's *A History of Thailand* (Cambridge UP 2009 — genuinely argues internal strain, not just military weakness, caused Ayutthaya's fall) and Wyatt's *Thailand: A Short History* (Yale UP 2003, standard reference). Both citations are legitimate and correctly characterized.

---

## 3. Support nodes (`support_nodes` table, 51 rows) — real-place research

**Most current cafe/OTOP names are generic placeholders, not real businesses.** Below are verified real replacements found via web search (Google Maps/TripAdvisor/official sites), or an explicit "not found" where no real match exists — per the game team's direction, nothing here is invented. Coordinates marked "exact GPS not published" are estimated from street/soi address (±100–200m) and should be spot-checked in Google Maps before writing to the DB.

### ayutthaya
- **Cafe:** Busaba Cafe & Bake Lab, 9/25 Chikun Alley (14.3577, 100.5637) — https://www.tripadvisor.com/Restaurant_Review-g303897-d8851706 · alt: BORAN Cafe and Restaurant (~14.3573, 100.5637)
- **OTOP:** Ayutthaya Pavilion (อยุธยา พาวิลเลียน), ~14.356, 100.585 (coord approximate) — https://ayutthayastation.com
- **Landmarks:** Wat Phra Si Sanphet — corrected to **14.355888, 100.558609** (given DB coord was ~1.8km off). Wat Yai Chaimongkol — corrected to **14.3453, 100.5925**. Bang Pa-In Palace — corrected to **14.23250, 100.57917** (this one is genuinely ~14km from the district center; that's expected, not an error).

### bang_kapi
- **Cafe:** Pacamara Coffee Roasters or Muji Coffee Corner, both inside The Mall Life Store Bangkapi (13.7522, 100.6099) — re-pin from current 13.778,100.642
- **OTOP:** Not found within Bang Kapi. Nearest lead (Min Buri) is ~15km away — keep placeholder flagged as fictional rather than substitute.
- **Landmark:** "วัดบางกะปิ" doesn't exist by that exact name — real temple locals call by that name is **Wat Uthai Tharam**, ~13.774,100.576 (note: administratively in Huai Khwang district, not Bang Kapi district) — https://th.wikipedia.org/wiki/วัดอุทัยธาราม

### bang_na
- **Cafe:** No business named "Suvarnabhumi Café" exists; a home-style cafe at Soi Wat Bang Na Nai Tai is a plausible real substitute but its exact name wasn't confirmed — needs on-the-ground check.
- **OTOP:** Not found — keep placeholder flagged as fictional.
- **Landmark:** "วัดบางนา" doesn't exist by that name — closer real match to the given coord is **Wat Bang Na Nai** (a royal temple near BTS Bang Na) rather than the riverside Wat Bang Na Nok.

### chatuchak
- **Cafe:** Roof Republic Cafe (real, findable) as a substitute if a single named business is required; the existing "JJ Market Coffee" pin is fine as generic in-market-stall flavor.
- **Market:** ตลาดนัดจตุจักร confirmed close to given coord — **13.8005, 100.5508**.
- **Landmark:** Chatuchak Park — corrected to **13.807484, 100.5554198** (given coord was ~1.2km off).

### dusit
- **Cafe:** ประกายสิริ (Prakaisiri), ~13.775, 100.514 — genuinely in Dusit, unlike the "Tha Phra Chan Café" placeholder (Tha Phra Chan is a real area but it's by Thammasat/Phra Nakhon, not Dusit) · alt: ท่ากาแฟ (Tha Kafe), inside a riverside Chinese shrine
- **OTOP:** Not found — keep placeholder flagged as fictional.
- **Landmarks:** Vimanmek Mansion — **13.7741, 100.5124** (note: dismantled 2019 for repairs, confirm current visitor status). Wat Benchamabophit — **13.7661, 100.5141**.

### ladphrao
- **Cafe:** BAKEBURY Espresso Bar HQ, Lat Phrao Soi 1 (~13.815, 100.561) — note its formal address is administratively Chatuchak district, though colloquially "Lat Phrao"
- **OTOP:** Not found — keep placeholder flagged as fictional.
- **Landmark:** Wat Lat Phrao is real (oldest temple in the district, houses relics from Kandy, Sri Lanka) — exact coordinate needs direct Maps confirmation, given placeholder (13.820,100.591) unverified either way.

### nonthaburi
- **Cafe:** บ้านท่าน้ำนนท์ (Chaopraya Antique Cafe) or Rongsi Studio (converted rice mill), both real riverside cafes near Nonthaburi Pier
- **Market:** Talat Nonthaburi — corrected to **13.859108, 100.521652**.
- **Landmark:** Wat Chaloem Phra Kiat — corrected to **13.8478, 100.4842** (given coord was ~1.9km off).

### pathumwan
- **Cafe:** True Coffee (Siam Square Soi 3), 13.7454, 100.5326 · alt: Coffee Gallery Cafe at Siam Center
- **OTOP:** Narai Phand (นารายณ์ภัณฑ์), the real Ministry-of-Industry OTOP-style handicraft center, President Tower, Ploenchit Rd — 13.7433, 100.5491
- **Landmark:** Erawan Shrine (ศาลท้าวมหาพรหม) — corrected to **13.7439, 100.5406** (given coord was ~500m off).

### phra_khanong
- **Cafe:** The Wood Land, Soi Sukhumvit 52 (~13.705, 100.601)
- **OTOP:** Not found — recommend dropping this node type for the district.
- **Landmark:** ⚠️ "Wat Phra Khanong" as literally named **does not exist**. The real Mae Nak-legend temple is **Wat Mahabut**, 13.7157, 100.6075 — but that's in **Suan Luang district**, not Phra Khanong, and ~2.3km outside a plausible radius. Recommend either relabeling+reassigning district, or dropping this landmark entirely.

### rattanakosin
- **Cafes:** Old Town Cafe' Bangkok (~13.752, 100.494, near Grand Palace/Wat Pho) · Golden Place Cafe at Tha Chang Pier (13.7527, 100.4913, Grand Palace view)
- **OTOP:** No real shop confirmed within Rattanakosin proper — nearest verified is Narai Phand (Pathumwan, ~2.5km away, outside radius). Recommend flagging "OTOP ผ้าไทย" as unconfirmed.
- **Landmarks:** Wat Phra Kaew — **13.7515, 100.4927**. Grand Palace — **13.7500, 100.4913**. Wat Pho — **13.7466, 100.4930** (one source returned a conflicting 13.7619/100.4846 pin that doesn't match Wat Pho's known location ~700m south of the Grand Palace — treat as a bad POI match, not use it).

### silom
- **Cafe:** Rocket Coffeebar (Sathorn Soi 12), 13.7227, 100.5259 — technically Sathorn/Bang Rak, within ~700m of the given point
- **OTOP:** Narai Phand's Charoenkrung branch (2-4 Oriental Ave, ~13.7247, 100.5147) for general OTOP; for the leather-specific placeholder, Siam Leather Goods (River City complex, ~13.7275, 100.5115)
- **Landmark:** ⚠️ Tiger God Shrine (ศาลเจ้าพ่อเสือ) is real but sits at Tanao Rd near the Giant Swing — **that's Phra Nakhon/Rattanakosin district, ~3km from Silom**, not Silom itself. Recommend reassigning district.

### sukhumvit
- **Cafe:** The Coffee Club, Soi Sukhumvit 23/Asoke (13.7375, 100.5605)
- **OTOP:** Terminal 21's own directory has no OTOP-labeled shop (only fashion/souvenir boutiques). Nearest real OTOP-style shop is Narai Phand, ~1.9km away (outside radius). Recommend dropping or reframing this node.
- **Landmark:** ⚠️ Jim Thompson House is real but at Soi Kasemsan 2, opposite the National Stadium — **that's Pathumwan district, ~3.3km from Sukhumvit**, not Sukhumvit. Corrected coords **13.7492, 100.5284**. Recommend moving this landmark to the `pathumwan` district entry.

### watthana
- **Cafes:** Rocket Coffeebar / D'ARK (Piman 49 complex, Soi 49, ~13.7305, 100.5720) for "Phrom Phong Brew" · Roast at theCOMMONS Thonglor (~13.7275, 100.5795) for "Thonglor Café" · Macchiato (Soi Ekkamai 12, ~13.7195, 100.5850) for "Ekkamai Coffee Roasters" — all three placeholders have real substitutes
- **OTOP:** Not found (area's retail identity is boutique/lifestyle malls, not OTOP-style outlets) — recommend dropping or reframing as a farmer's-market node
- **Landmark:** No landmark was seeded for watthana in the current DB — suggested real addition: **Wat That Thong** (วัดธาตุทอง), next to BTS Ekkamai, built 1938–40 under Rama VIII patronage, ~40m golden chedi — ~13.7195, 100.5855

### satit_test [TEST district — not researched]
Explicit QA fixture per existing project notes — excluded from real-place research since it's slated for removal before production cleanup, not public-facing content.

---

## 4. Reference tables (unchanged from previous snapshot — coordinates as currently in DB)

### Districts — watchtower check-in points (14 rows)
| District ID | Thai | Watchtower lat, lng |
|---|---|---|
| `ayutthaya` | อยุธยา | *(null — no single watchtower; see lore chain)* |
| `bang_kapi` | บางกะปิ | 13.7640, 100.6074 |
| `bang_na` | บางนา | 13.6681, 100.5997 |
| `chatuchak` | จตุจักร | 13.7997, 100.5500 |
| `dusit` | ดุสิต | 13.7716, 100.5132 |
| `ladphrao` | ลาดพร้าว | 13.8136, 100.5765 |
| `nonthaburi` | นนทบุรี | 13.8621, 100.5144 |
| `pathumwan` | ปทุมวัน | 13.7306, 100.5450 |
| `phra_khanong` | พระโขนง | 13.7088, 100.6010 |
| `rattanakosin` | พระนคร | 13.7500, 100.4913 |
| `satit_test` [TEST] | สาธิตประสานมิตร | 13.74322, 100.56583 |
| `silom` | บางรัก/สีลม | 13.7283, 100.5268 |
| `sukhumvit` | สุขุมวิท | 13.7445, 100.5605 |
| `watthana` | วัฒนา | 13.7305, 100.5636 |

### BTS/MRT transit bonus zones (6 rows, ×2 points, 300m radius each)
Siam BTS (13.7455,100.5348) · Asok BTS (13.7370,100.5604) · Mo Chit BTS (13.8026,100.5538) · Sala Daeng BTS (13.7286,100.5341) · Sanam Chai MRT (13.7437,100.4941) · Chatuchak Park MRT (13.8021,100.5530)

### Figures with real map coordinates (27 of 74 rows — the other 47 have `lat`/`lng` NULL, render at district watchtower fallback)
Unchanged from previous snapshot: `fig-s-01, fig-s-09, fig-s-10, fig-s-14, fig-a-01, fig-a-03, fig-a-06, fig-b-01, fig-b-04, fig-b-06, fig-b-07, fig-b-16, fig-b-18, fig-mock-satit-b-01, fig-c-01, fig-c-02, fig-c-04, fig-c-05, fig-c-06, fig-c-07, fig-c-08, fig-c-09, fig-c-13, fig-c-14, fig-c-16, fig-c-21, fig-c-22`.

### figure_relations (8 edges, table `figure_relations`)
| From | To | Relation |
|---|---|---|
| Queen Sri Suriyothai | King Naresuan | ร่วมยุคอยุธยา (same Ayutthaya era) |
| Sunthorn Phu | Khun Wichitmatra | นักวรรณกรรมพระนคร (Rattanakosin literary figures) |
| King Taksin | Khun Wichitmatra | ผู้บันทึกประวัติศาสตร์ (historical recorder) |
| King Taksin | Bangkok Fishermen | ยุคต้นกรุงรัตนโกสินทร์ (early Rattanakosin era) |
| Canal Trade Communities | Chinese Merchant Families of Yaowarat | เส้นทางค้าคลอง (canal trade route) |
| Bangkok Fishermen | Chinese Merchant Families of Yaowarat | ชาวพระนคร (Phra Nakhon residents) |
| Pridi Banomyong | Weavers of Ban Krua | เพื่อนบ้านปทุมวัน (Pathumwan neighbors) |
| MR Kukrit Pramoj | Somdet Sri Suriyawong | ร่วมยุคสมัยใหม่ (shared modern era) |
All 8 edges connect figures with no factual claim beyond "shared era/place" — no further fact-check needed.

---

## 5. Recommended next steps (not yet executed — report only)

1. **Decide fate of the 7 likely-fictional figures** (§0) — replace with documented alternates or remove.
2. **Apply the 10 confirmed text corrections** (§0 table) to `figures.description`.
3. **Fix 3 lore_node factual errors**: `lore-ladphrao` (Rama III not V), `lore-sukhumvit` (Phra Bisal Sukhumvit, not "Phraya Sukhumnaiwinit"), `lore-ayt-1` (chang figure).
4. **Add "according to tradition" framing** to the Naresuan duel and Ramkhamhaeng inscription content, given real unresolved scholarly controversy.
5. **Resolve 3 wrong-district landmarks**: Tiger God Shrine → rattanakosin, Jim Thompson House → pathumwan, "Wat Phra Khanong" → replace or drop.
6. **Fill `birth_year`/`death_year`/`bio_th`** on all figures using the corrected years above (`patch_figure_bio.sql` already has the columns; they're just empty).
7. **Replace placeholder support-node names** with the real businesses/landmarks found in §3, where a real match was found; explicitly drop/reframe the handful marked "not found" rather than inventing names.
