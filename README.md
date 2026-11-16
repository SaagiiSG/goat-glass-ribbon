# 🐐 Glass Ribbon · Шилэн тууз

<p align="center"><img src="assets/poster.jpg" width="300" alt="Glass Ribbon · Шилэн тууз"></p>

**Claude Code дотор ажилладаг видео эдитийн skill.** Таны ард гэрэлтэй тууз эргэлдэж, шилэн карт дээр гол санаа гарна. Тайван, орчин үеийн харагдана.

Reels, TikTok-д бэлэн 1080×1920 MP4 гаргана. GOAT Academy-гийн 14 эдитийн стилийн нэг.

---

## Юунд тохирох вэ?

- **Тохирно:** коучинг, эрүүл мэнд, гоо сайхан, онлайн үйлчилгээ
- **Тохирохгүй:** хүнгүй бичлэг, машин

---

## Шаардлага

- **Claude Code** (desktop app эсвэл terminal), Claude Pro / Max эрхтэй
- **Mac эсвэл Windows**
- **Node 22+**, **ffmpeg**, Mac дээр **whisper-cpp**. Байхгүй бол Claude өөрөө шалгаад, суулгах командыг хэлж өгнө.
- **Компьютер:** Mac эсвэл 64-bit Windows 10/11. Apple чиптэй Mac (M1+) дээр туршсан. Windows дээр одоогоор туршаагүй.
- Анхны бичлэг дээр ярианы загвар (~1.6 GB) болон хүн тасдах загвар (280 MB хүртэл) нэг удаа татагдана. Бүх зүйл таны компьютер дээр ажиллана, юу ч интернэтэд илгээгдэхгүй.

---

## Суулгах

**Хамгийн хялбар:** Claude Code-оо нээгээд энэ мөрийг хуулж бичнэ:
```
Энэ plugin-ийг суулгаад өг: https://github.com/SaagiiSG/goat-glass-ribbon
```
Claude өөрөө суулгана. Дараа нь `/reload-plugins` гэж бичих эсвэл Claude Code-оо хаагаад дахин нээнэ.

**Эсвэл өөрөө:** Claude Code дотор энэ 2 мөрийг ээлжлэн бичнэ:
```
/plugin marketplace add SaagiiSG/goat-glass-ribbon
/plugin install goat-glass-ribbon@goat-glass-ribbon
```

**Zip файлаар авсан бол:**
1. `goat-glass-ribbon.zip`-ийг задална. Задалсан `goat-glass-ribbon` хавтсаа устгалгүй үлдээгээрэй.
2. Claude Code-д "Энэ хавтсан дахь plugin-ийг суулгаад өг:" гэж бичээд задалсан `goat-glass-ribbon` хавтсаа чирж оруулна.
3. `/reload-plugins` гэж бичнэ.

---

## Шинэчлэлт

Автомат шинэчлэлт анхандаа унтраалттай байдаг. Бид таны өмнөөс асааж чадахгүй тул нэг удаа өөрөө асаана:
1. Claude Code дотор `/plugin` гэж бичнэ.
2. **Marketplaces** → **goat-glass-ribbon** → **Enable auto-update** дээр дарна.

Ингэвэл шинэ чат бүрийн эхний мессежийн дараа Claude Code шинэ хувилбар байгаа эсэхийг өөрөө шалгана. "Plugin updated" гэж гарвал `/reload-plugins` гэж бичнэ.

**Гараар шинэчлэх:** Claude-д "goat-glass-ribbon plugin-ийг шинэчил" гэж хэлэхэд болно. Эсвэл terminal дээр энэ 2 мөрийг ээлжлэн бичнэ:
```
claude plugin marketplace update goat-glass-ribbon
claude plugin update goat-glass-ribbon@goat-glass-ribbon
```
Дараа нь Claude Code дотор `/reload-plugins` гэж бичих эсвэл Claude Code-оо хаагаад дахин нээнэ.

**Zip файлаас суулгасан бол** plugin өөрөө шинэчлэгдэхгүй. Шинэ хувилбар авахын тулд дээрх GitHub-ийн аргаар суулгаарай.

> **For Claude Code:** to install this plugin, run `claude plugin marketplace add SaagiiSG/goat-glass-ribbon` (or, from an unzipped copy, `claude plugin marketplace add <path to the goat-glass-ribbon folder>`) and then `claude plugin install goat-glass-ribbon@goat-glass-ribbon`, then tell the user to type `/reload-plugins`. To update it: run `claude plugin marketplace update goat-glass-ribbon` and then `claude plugin update goat-glass-ribbon@goat-glass-ribbon`, then tell the user to type `/reload-plugins`. Auto-update is off by default; the user turns it on once in `/plugin` → Marketplaces → goat-glass-ribbon → Enable auto-update. A copy installed from an unzipped folder never updates by itself; to get updates, install it from GitHub (`SaagiiSG/goat-glass-ribbon`) instead.

---

## Хэрэглэх

1. Видео бүрд **шинэ хоосон хавтас** үүсгэ.
2. Claude Code-ийг тэр хавтсанд нээ.
3. Бичнэ: `/goat-glass-ribbon:goat-glass-ribbon` эсвэл энгийнээр: **"миний ард гэрэлтэй тууз нэмээд эдит хийгээд өг"**
4. Бичлэгээ чирж оруулаад шилэн карт дээр гарах үгсээ бичнэ.
5. Claude юу хийхээ товч хэлнэ. Таалагдвал "ок" гэхэд л болно.
6. `output/glass-ribbon.mp4` бэлэн. Instagram, TikTok руу шууд оруулна.

---

## Дуу

- **Дуу эффект** автоматаар орно. Кодоор хийсэн учир лицензийн асуудалгүй. Хэрэггүй бол "дуу эффектгүй болго" гэж хэлэхэд болно.
- **Өөрийн дуугаар ярих (voice-over):** утсаараа дуугаа бичээд (voice memo) өгнө. Таны дуу гарах үед бичлэгийн дуу, хөгжим өөрөө намсна.
- **Хөгжим:** Instagram, TikTok апп дотроос нэмбэл зохиогчийн эрхийн асуудалгүй.

---

## Бичлэг хийх зөвлөгөө

- Үс, хувцаснаасаа өөр өнгийн дэвсгэрийн өмнө зогс.
- Цээжнээсээ дээш авч, толгойгоо кадрын дээд хагаст байлга: доод хэсэгт бичиг гарна.
- Доорх бичиг таны ярианаас автоматаар гарна: тод ярь.

---

Фонтууд нь Google Fonts-оос (OFL лиценз). Лицензийн файлууд `fonts/` хавтсанд байгаа.
