---
name: goat-glass-ribbon
description: Glass Ribbon · Шилэн тууз. Edits a talking-head video into a violet-graded look with a glowing ribbon and purple orbs floating behind the speaker, a frosted glass card, a white pill and plain white captions made from what they say, where a key word turns into a big serif italic; a soft light streak wipes to a speaker-free glass scene that acts out what they say (a big number, a quote, a before and after, a ticked list, news, a chat or steps). Cuts the pauses out, cuts the person out on every frame. Renders a 1080x1920 MP4 for Reels/TikTok. Best for skincare, beauty, wellness and coaching. Use whenever the user wants a glass, glowing, violet or "premium" talking-head edit, "шилэн тууз", "гэрэлтэй тууз", "алхмуудаар тайлбарла", "ribbon behind me", "glass cards", or types /goat-glass-ribbon, even if they don't name the skill.
---

# Glass Ribbon · Шилэн тууз

The speaker fills the screen in a soft violet grade. A glowing violet-to-white ribbon floats behind them, with a few purple orbs bobbing around it. A frosted glass card sits top right with a short serif italic title. Under the face, plain white captions of their own words, the key word now and then in big serif italic ("арьсаа *хайрла*"), and a small white pill above them. When it helps, a soft violet light streak sweeps across as the speaker fades into a glass scene without them that acts out what they are saying: one big number or word glowing in, a line of theirs written in word by word, a before and after joined by a glowing arrow, a list ticking on, a news panel building its headline, a chat typing a question and its answer, or numbered glass cards for steps. It is the only GOAT look built from glass and light.

**Good for:** skincare, beauty, wellness, coaching: "how to", routines and 3-step explainers. One person talking to the phone.
**Not for:** barbers, auto, rough or outdoor footage, two or more people, and busy backgrounds (crowds, shelves, leaves, neon signs) that the cut-out can't separate from the person. If the footage is like that, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`. `goat` below means `node SKILL_DIR/scripts/goat.mjs`.

## 1. Setup check (first time on a machine)

**Every new video, first:** run `claude plugin marketplace update goat-glass-ribbon`, then `claude plugin update goat-glass-ribbon@goat-glass-ribbon`. If it installs a new version, tell the user a new version was installed and ask them to type `/reload-plugins` before you go on. If either command fails (offline, or installed from a zip), carry on and don't mention it.

Run `node --version` (needs 22 or newer) and `ffmpeg -version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install node ffmpeg whisper-cpp` (whisper-cpp makes the captions; Homebrew's build uses the Mac's graphics chip, so it is fast).
- Windows: `winget install OpenJS.NodeJS.LTS` and `winget install Gyan.FFmpeg`, then close and reopen the terminal. For captions, download `whisper-bin-x64.zip` from https://github.com/ggml-org/whisper.cpp/releases, unzip it, and set `HYPERFRAMES_WHISPER_PATH` to the `whisper-cli.exe` inside (`setx HYPERFRAMES_WHISPER_PATH "C:\path\to\whisper-cli.exe"`, then reopen the terminal). Without it the captions step tries to build Whisper and needs developer tools.

The first video downloads, once: the speech model (Whisper large-v3-turbo, about 1.6 GB), the cut-out model (26 MB; about 280 MB if HyperFrames has never cut anyone out on this computer, since it then also fetches its model runtime and its own backup cut-out model), and a private copy of Chrome that draws the frames. Tell the user the first run takes a while; after that it starts at once. Nothing is uploaded: everything runs on their computer, with no account.

**Long steps:** the first `transcribe` (the 1.6 GB download) and every `render` can run longer than a normal command timeout. Run them in the background, or with a 600000 ms timeout, and wait for them to end. Never stop one and start it again: an interrupted download starts again from zero. Whisper needs about 2 GB of memory; on an 8 GB computer ask the user to close other heavy apps first.

**Windows has not been tested yet.** If a step fails there, show the error to the user in plain words and suggest a look without a cut-out (for example goat-soft-glow).

## 2. Collect the clips and words

Make `raw/` and `output/` in the current folder. Ask for:
1. **The clips:** the user talking to the phone camera. Drag them into the chat or copy them into `raw/`.
2. **What the video says.** Every text on screen (the card, the pill, and the scene, whatever its kind) must match what this video says; you take them from the speech after the transcript (section 3) and the user confirms them. The captions come from the speech itself. Never invent a word, a price, a phone number or a date. If something is unclear, ask.

**What to film** (tell the user before they shoot, if they haven't yet):
- Phone upright, filmed from the chest up, the top of the head about a quarter of the way down the screen and the chin about halfway. The glass card sits top right, above the head; the captions sit under the chin. A close-up where the face fills the screen pushes the captions low, where the app's own text can cover them.
- A plain background that contrasts with hair and clothes (dark hair against a light wall, or a light top against a dark room). The cut-out finds the person by contrast. Leave some space on both sides of the head: the ribbon shows there.
- One person, soft light on the face, no one walking behind. Speak clearly; the captions come from the speech.

If they speak English, add `"language": "en"` to plan.json, so the transcript comes out in English (Whisper hears Mongolian otherwise).

Then run `goat probe raw/*`. It prints each file's size, length, whether it has sound, whether it is HDR, and `speech` spans (when someone is talking).

## 3. Prepare, transcribe, star a word, cut

Write `plan.json` in the project folder with just the output and the clips for now (paths are relative to it), e.g. `{"output": "output/glass-ribbon.mp4", "clips": [{"src": "raw/IMG_0412.MOV"}]}`. `in`/`out` trim a video (seconds). Add `"sound": false` to mute one clip. `cx`/`cy` (0–1, default 0.5) choose which part of a wider frame is kept.

Then run these in order. Each one says what to run first if a step is missing.
1. `goat prep plan.json`: joins the clips into one upright 1080x1920 video in the violet grade.
2. `goat transcribe plan.json`: writes what the speaker says, word by word with times, to `.work-glass-ribbon/transcript.json`, and prints it as caption lines.
3. **Fix the words.** Whisper gets many Mongolian words wrong. Fix obvious spelling yourself, then show the user the caption lines and ask them to correct anything wrong. Change only the `text` of each word in `transcript.json`; keep `start` and `end`. If two words came out as one, split the time between them; if one word came out as two, give the merged word the first one's `start` and the second one's `end`. If Whisper missed words the user did say, add them with times between their neighbours. Never add words they didn't say. If the transcript is junk (music, no speech), write `[]` into `transcript.json`: captions and pause cutting turn off.
4. **Star the key words.** Pick only the words that carry the point or the feeling of what is said, usually a key noun or verb ("арьсаа *хайрла*", "гурван *алхам*", "өнөөдрөөс *эхэл*"), and add `"star": true` to each in `transcript.json`, e.g. `{"text": "хайрла", "start": 1.32, "end": 1.71, "star": true}`. Most lines get no star: about one starred word every 2–3 lines (2–3 in a 6-second clip) reads as design; a star in every line looks random. One per line at most. Never a little word (нь, бол, энэ, ба, л), a number or price, or a word you aren't sure Whisper got right. That word shows in big Cormorant italic; the rest stay plain white. Show the user the lines with the starred words in *stars* and tell them they can move a star, add one or take one away.
5. `goat cut plan.json`: cuts the pauses down to a short breath and moves the word times (and stars) to match. It prints the old and new length. It only cuts where it also hears quiet, never cuts photos or clips without sound, and stops with a message if it would cut more than 60% of the video. Add `"cut": false` to plan.json if the user doesn't want pauses cut. **If the words or stars are changed after this step, run `cut` again** (it is quick: the video is reused when the cuts don't change); `render` refuses to run on an old cut.

After the cut, the caption lines can come out a little different from the printed ones (a pause that was cut can join two short lines). A line never holds two starred words: it splits before the second.

Then read `.work-glass-ribbon/words.json` (the words with their times after the cut) to time the card, the pill and the scene.

## 4. Write the words

Add `texts` to plan.json. **Every text comes from what this video says**, in the speaker's own words where they fit, timed to when they say it:
- `card`: the topic of the video, from their words (a 1–3 word title).
- `pill`: one key detail they say (a time, a day, a who), shown while they say it.
- a **scene** that acts out what they say, in their words. Read what is said and pick the kind that shows it best:
  - `big` for a number or one word that is the point ("Day 1", "3x", "100%");
  - `quote` for a punchline: one line of theirs that should land;
  - `compare` for a before and after (what it was → what it becomes);
  - `list` for a few things they name (2–4 short items that tick on);
  - `step` for steps in order, each card timed to when they say it ("first…, then…, last…");
  - `news` when they announce or tell news (a launch, something new, something that happened);
  - `chat` when they talk about an app, AI or messages, or a question people ask and its answer.

  Be creative within the look (the kind, what the badge says, how the question is put), but every word on it comes from the speech, and never a new fact, price, number or date. Most videos need one scene; a longer one can have a few, with 1 s or more of the speaker between them.

If a text is too long for its row, shorten it from the same words; never add a new fact. If what they say is unclear, ask the user what to show; never invent. Tell the user each text with its time and which of their words it comes from, and ask them to confirm.

Times are in the cut video (from `words.json`). The texts below only show the shape of a plan (a skincare video listing three steps); never put example text in a video:

```json
{
  "output": "output/glass-ribbon.mp4",
  "clips": [{"src": "raw/IMG_0412.MOV"}],
  "texts": [
    {"role": "card", "text": "Арьс арчилгаа", "start": 0, "end": 3.6},
    {"role": "pill", "text": "Өдөр бүр", "start": 0.8, "end": 3.6},
    {"role": "step", "text": "Цэвэрлэгээ", "start": 4.6, "end": 8.0},
    {"role": "step", "text": "Чийгшүүлэлт", "start": 5.1, "end": 8.0},
    {"role": "step", "text": "Хамгаалалт", "start": 5.6, "end": 8.0}
  ]
}
```

**texts** (each has `start` in seconds; `end` is optional and defaults to the end of the video):
- `card`: the frosted glass card top right, a serif italic title (1–3 words) over two soft lines. It rises in and fades out. One card at a time: a later card ends the one before. **14 characters a row at most** (spaces count); split a longer title into 2 rows yourself with `\n` (2 rows at most). It is 44 px; only a row of the widest capitals (Ш Щ Ю Ж) shrinks, down to 28 px. Start a card at `0` to have it on the first frame (the Reels thumbnail).
- `pill`: a small white label just above the captions ("Өдөр бүр"). One row of **26 characters at most**, 30 px. One pill at a time.
- **Every scene** starts with a soft violet streak sweeping across (0.8 s) 0.4 s before its `start`, as the speaker crossfades over half a second into a violet backdrop with the glowing line and two drifting orbs; at its `end` it goes back to the speaker the same way. The speaker's voice keeps playing and the captions stay where they are. One scene at a time.
- `news`: `{"role": "news", "text": headline, "badge": label, "line": small line, "start": …, "end": …}`. A big glass panel rises as the streak crosses (no empty backdrop), the badge (optional) lands softly, the headline builds word by word in Cormorant italic (104 px, rising out of a blur), the line (optional) follows, and a soft sweep of light crosses the glass. Headline: **2 rows of 13 characters at most** (split it with `\n`; only rows of the widest capitals shrink, down to 56 px). Badge: one row of **12** (Inter 700, 30 px), the word they use for what it is (new, a launch, a sale). Line: one row of **23** (Inter 32 px), who and when, from their words. Its words start at `start` (the badge just before), 0.08 s apart, each landing in 0.4 s (the line 0.3 s after that), then 1 s to read: a 3-word headline with a line needs 1.9 s.
- `chat`: `{"role": "chat", "name": who it is with, "text": message, "reply": reply, "start": …, "end": …}`. A glass chat app rises as the streak crosses (a back arrow, an avatar with an online dot, the `name` or two soft lines, a menu); the message types itself into a violet bubble at 24 letters a second, three dots breathe in a glass bubble and fade, then the reply rises in their place, larger. `name` (optional): the app, person or business they talk about, from their words; one row of **16** (Inter 600, 36 px). Message: **2 rows of 16 characters at most** (Inter 500, 42 px). Reply: **2 rows of 14 at most** (Inter 600, 48 px). Split rows with `\n`. It needs its letters ÷ 24 + 2.3 s (typing from 0.2 s, the reply landed 1.1 s after the typing, then 1 s to read): a 27-letter message needs 3.4 s.
- `big`: `{"role": "big", "text": word or number, "line": small line, "start": …, "end": …}`. A glass panel rises as the streak crosses and the word or number blurs in out of a soft violet glow, white, up to 220 px (a number of 10 or more, with its sign kept, counts up as it lands and ends exactly as written; a year or a number with a leading zero just blurs in); the line (optional) rises under it. Text: one row of **7 characters at most** (Inter 800; a row of the widest capitals shrinks to 100 px). Line: one row of **21** (Inter 34 px). It lands 0.45 s after its `start` (0.65 s counting, 0.75 s with a line), then needs 1 s to read.
- `quote`: `{"role": "quote", "text": their line, "start": …, "end": …}`. A violet quotation mark, then their words write in one by one (0.1 s apart) in Cormorant italic, 84 px, on a glass panel. **3 rows of 13 characters at most** (split with `\n`; only rows of the widest capitals shrink, to 56 px). Use their exact words. It needs 0.1 s a word after the first + 0.45 s, then 1 s to read: a 4-word quote needs 1.75 s.
- `compare`: `{"role": "compare", "text": before, "after": after, "start": …, "end": …}`. The before card (Inter 52 px, dimmer), a glowing arrow drawing down, then the after card landing (Cormorant italic, 80 px down to 60 for a long row, glowing). Before: **2 rows of 14**; after: **2 rows of 12** (split with `\n`). The after lands 1.2 s in, then 1 s to read: it needs 2.2 s.
- `list`: `{"role": "list", "text": "item\nitem\nitem", "start": …, "end": …}`. One item per row, **2 to 4 items of 14 characters** (Inter 46 px; an item never wraps: shorten it). Each slides in beside a glass ring that fills violet and ticks, 0.5 s apart, the first as the scene comes in. It needs 1.35 s + 0.5 s an item after the first: 2 items need 1.85 s. Use `list` for things they name; `step` when the order matters or each should land as they say it.
- `step`: a numbered glass card. Steps that overlap or touch in time share one scene; the cards rise one by one (01 bottom left, 02, 03 top right; each eases up over 0.5 s, at least 0.3 s after the one before) along the glowing line. **At most 3 steps per scene.** One row of **15 characters at most**, 32 px (a row of the widest capitals shrinks to 28).

A longer, empty or extra row is refused with a message saying which: shorten it from the same words. Emoji can't be drawn, and the card title's font has no ★ or ✓.

**Timing rules** (render and validate refuse a plan that breaks one, saying which and how to fix it):
- A card or pill shows 1 s or more. Give each 2–3 s to read.
- A scene covers the speaker, card and pill. A card or pill still up when a scene wipes in ends there (it fades out as the streak comes, and doesn't come back after the scene), so it must have 1 s on screen before the scene. None can start while a scene shows or while its streak goes back: start it 0.4 s or more after the scene ends.
- The first scene starts 0.8 s in or later: the video opens on the speaker (the thumbnail).
- Each step card shows 1 s or more (its start to the scene's end). Give a scene about 1 s per step plus 1–2 s to read.
- A scene of one text (big, quote, compare, list, news, chat) lasts long enough to build and read (see each kind above). Between two scenes the speaker shows 1 s or more; scenes never overlap. Steps that should share a scene must overlap or touch.
- A scene that ends in the last 0.4 s of the video stays to the end (no streak back).

**Captions** come from `words.json`: plain white, 2–4 words at a time, a hard swap with no animation, the starred word in big Cormorant italic. They sit under the speaker's usual chin (read from the cut-out all through the video, so one odd frame, a hand by the face, doesn't move them), never higher than the lower third, at one height for the whole video (scenes too), so a caption never moves. When they would sit just below the safe area, they move up into it if that still leaves 30 px under the chin. They shrink to fit the safe width: a line of ordinary words stays 54 px. Add `"captions": false` to turn them off. If the render prints a note that the captions sit below the safe area, the face fills the screen: tell the user the app's own text may cover them and suggest filming from the chest up. If it prints a note that the glass card sits on the speaker's head, suggest filming with more room above the head, or move the card to a moment when the head is lower.

**look:** no options. The violet grade, ribbon and orbs are the look.

**Auto sound effects** (soft, about a third of the old version's levels; raise them with `"sfx": {"volume": 1.5}`): a swish with each light-streak wipe, a shimmer as the glass card rises (none for a card already up on the first frame), a softer shimmer as each numbered card rises, a shimmer as a news badge or a big word lands, a whoosh as a compare's arrow draws, a soft tick as each list item ticks, a soft typing sound while a chat message types and a notify as the reply comes (a quote stays quiet). Never two within 0.5 s, and nothing over the typing.

Before rendering, tell the user the plan in plain words (the card, the pill, the scene's kind and every word on it, each with its time and which words of theirs it comes from, and the starred words) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio-node.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `node SKILL_DIR/scripts/goat.mjs probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 5. Render and check

`goat render plan.json`

It cuts the person out of every frame, draws the look, mixes the sound and writes the MP4 plus a contact sheet (one frame per second) at `.work-glass-ribbon/sheet.jpg`. On our test Mac a 6 s clip took about 1.5 to 2 min: 1 to 1.5 min to cut the person out (about half a second a frame, so a 30 s video spends 6 to 9 min on it), then about 16 s to draw. A render after a change to the texts only takes the drawing time: the cut-out is kept until the video changes. Longer videos take longer, and more if the computer is busy. Run the next render only after the last one ends. If it prints a note that the sharp cut-out failed, the video was still made, with HyperFrames' rougher cut-out: tell the user in plain words and look harder at the hair edge.

Read the contact sheet, the first frame and full-size frames 0.4 s after each part starts and 0.1 s before it ends (a part is the speaker before, between and after the scenes, and each scene). Never pull a frame within 0.45 s of a scene's start or end (the streak is crossing). For the example plan:
`ffmpeg -y -loglevel error -i output/glass-ribbon.mp4 -frames:v 1 output/check-0.jpg`
`ffmpeg -y -loglevel error -ss 1.2 -i output/glass-ribbon.mp4 -frames:v 1 output/check-1.2.jpg` (card, pill and captions in)
`ffmpeg -y -loglevel error -ss 6.4 -i output/glass-ribbon.mp4 -frames:v 1 output/check-6.4.jpg` (all three step cards in; for any other scene, pull it 1 s after it is built: the big word, the whole quote, the after card, every list tick, the news headline and line, or the chat reply in)
Check that:
- every word is spelled right (Ө ө Ү ү!) and whole, and the starred word is the one the user agreed on;
- the ribbon passes behind the speaker (never over the face) and the cut-out edge follows the hair and shoulders, with no coloured fringe;
- the glass card, pill and captions don't cover the face or mouth. If they do, say so and suggest filming from the chest up with room above the head.

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 6. Hand over

Tell the user where the file is (`output/glass-ribbon.mp4`) and that it is ready to post. Music can be added in the Instagram/TikTok app.

## Rules

- Every word and graphic on screen comes from what this video says or shows, or from what the user gave you. The examples in this file are only examples: never put them in a video. If the user hasn't given the words, ask.
- A price, phone number or offer goes in a `card`, `pill` or `step`, which sit inside the area no app buttons cover. Never rely on the captions, ribbon or orbs to carry it. Never invent a price, number or date; ask.
- Use only the fonts bundled in `SKILL_DIR/fonts` (Inter and Cormorant Garamond Italic; they have Ө ө Ү ү and ₮). Don't swap in other fonts.
- Captions stay plain white with no highlight, pop or bounce; only a starred word changes font. Star only key words: most lines have none, and one per line at most.
- The speech model, cut-out model and Chrome run on the user's computer. Nothing is uploaded.
- The output is 1080x1920, 30 fps, H.264, sound normalised to -14 LUFS (Instagram/TikTok level).
