---
name: goat-glass-ribbon
description: Glass Ribbon · Шилэн тууз. Edits a talking-head video into a violet-graded look with a glowing ribbon and purple orbs floating behind the speaker, a frosted glass card, and Mongolian captions where one word turns into a big serif italic; a purple light streak wipes to a speaker-free scene of numbered glass cards for steps. Uses a person cut-out on every frame. Renders a 1080x1920 MP4 for Reels/TikTok. Best for skincare, beauty, wellness and coaching. Use whenever the user wants a glass, glowing, violet or "premium" talking-head edit, "шилэн тууз", "гэрэлтэй тууз", "алхмуудаар тайлбарла", "ribbon behind me", "glass cards", or types /goat-glass-ribbon, even if they don't name the skill.
---

# Glass Ribbon · Шилэн тууз

The speaker fills the screen in a soft violet grade. A glowing violet-to-white ribbon floats behind them, with a few purple orbs. A frosted glass card sits top right with a short title, and the caption in the lower third mixes plain words with one big serif italic word ("арьсаа *хайрла*"). For steps, a purple light streak wipes across to a scene without the speaker: numbered glass cards (01, 02, 03) rise one by one along a glowing line. It is the only GOAT look built from glass and light.

**Good for:** skincare, beauty, wellness, coaching: "how to", routines and 3-step explainers.
**Not for:** barbers, auto, rough or outdoor footage, two or more people, and busy backgrounds the cut-out can't separate from the person. If the footage is like that, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`.

## 1. Setup check (first time on a machine)

Run `ffmpeg -version` and `uv --version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install ffmpeg uv`
- Windows: `winget install Gyan.FFmpeg` and `winget install astral-sh.uv`, then close and reopen the terminal.

The first render downloads Pillow, numpy and MediaPipe (the person cut-out, about 120 MB) once. Tell the user it takes a few minutes the first time. After that it starts at once.

**Computers:** a Mac with Apple silicon (M1 or newer, macOS 13 or newer) or 64-bit Windows 10/11. Intel Macs can't run it: MediaPipe stopped making builds for them in 2023. Windows has not been tested yet, so if the render fails there, show the error to the user and suggest a look without a cut-out (for example goat-soft-glow).

## 2. Collect the clips and words

Make `raw/` and `output/` in the current folder. Ask for:
1. **The clips:** the user talking to the phone camera. Drag them into the chat or copy them into `raw/`.
2. **The words:** what they say (for captions, with one word to stress in each), a short card title (e.g. "Арьс арчилгаа"), a small label for the pill (e.g. "Өдөр бүр"), and the steps if they explain one (up to 3, e.g. "Цэвэрлэгээ", "Чийгшүүлэлт", "Хамгаалалт"). Never invent a price, phone number or date. Ask.

**What to film** (tell the user before they shoot, if they haven't yet):
- Film with your head in the upper half of the frame so captions don't cover your face. Phone upright; captions sit in the lower third.
- A plain background that contrasts with hair and clothes (dark hair against a light wall, or a light top against a dark room). The cut-out finds the person by contrast.
- One person, soft light on the face. Leave some space on both sides of the head: the ribbon shows there.

If this folder was already edited with `goat-video-editor`, use `output/cut.mp4` as the clip and `transcript/cut_words.json` for word times.

Then run: `uv run SKILL_DIR/scripts/goatcut.py probe raw/*`
It prints each file's size, length, whether it has sound, whether it is HDR, and `speech` spans (when someone is talking). Use these to time the words.

## 3. Write plan.json

Write `plan.json` in the project folder. Paths are relative to it.

```json
{
  "output": "output/glass-ribbon.mp4",
  "clips": [
    {"src": "raw/IMG_0412.MOV", "in": 0.5, "out": 12.0}
  ],
  "texts": [
    {"role": "card", "text": "Арьс арчилгаа", "start": 0.4, "end": 3.6},
    {"role": "pill", "text": "Өдөр бүр", "start": 0.8, "end": 3.6},
    {"role": "caption", "text": "арьсаа *хайрла*", "start": 0.8, "end": 3.6},
    {"role": "step", "text": "Цэвэрлэгээ", "start": 4.2, "end": 7.5},
    {"role": "step", "text": "Чийгшүүлэлт", "start": 4.7, "end": 7.5},
    {"role": "step", "text": "Хамгаалалт", "start": 5.2, "end": 7.5},
    {"role": "caption", "text": "гурван *алхам*", "start": 5.6, "end": 7.5},
    {"role": "caption", "text": "өнөөдрөөс *эхэл*", "start": 8.0, "end": 11.5}
  ]
}
```

**clips** play in order. `in`/`out` trim a video (seconds). Add `"sound": false` to mute one clip. `cx`/`cy` (0–1, default 0.5) choose which part of a wider frame is kept.
**texts:**
- `caption`: white words in the lower third. Put `*stars*` around the one word to stress: it turns into a big serif italic ("арьсаа *хайрла*"). One caption at a time; long lines shrink to fit. Keep it to 2–4 words.
- `pill`: a small white label just above the caption ("Өдөр бүр").
- `card`: a frosted glass card top right, in front of the speaker, with a serif italic title (1–3 words) and two soft lines under it.
- `step`: a numbered glass card. Steps that overlap in time share one scene: the screen wipes with a purple light streak to a violet backdrop without the speaker, and the cards rise one by one (01, 02, 03) along a glowing line, then it wipes back to the speaker after the last step ends. The wipe starts 0.4 s before the first step. At most 3 steps per scene. The speaker's voice keeps playing, and captions still show.
**look:** no options. The violet grade, ribbon and orbs are the look.

**Auto sound effects:** a swish with each light-streak wipe, a shimmer as the glass card appears, a softer shimmer as each numbered card rises.

**Timing:** a caption every 2–3 s, timed to the speech. The ribbon and orbs fade in over the first 0.6 s. Give a step scene about 1 s per step plus 1–2 s to read.

Before rendering, tell the user the plan in plain words (the clips, captions with the stressed word, the card, the steps) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `goatcut.py probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 4. Render and check

`uv run SKILL_DIR/scripts/render.py plan.json`

The cut-out runs on every frame, so it takes about 2–3 times the video length on an M1-or-newer Mac (a 30 s video in about 1–1.5 min), longer if the computer is busy. Then look at three frames before saying it is done:
`ffmpeg -y -loglevel error -ss 2 -i output/glass-ribbon.mp4 -frames:v 1 output/check-1.jpg` (and two more times, one inside the step scene). Read them. Check that:
- the ribbon passes behind the speaker (not over the face) and the cut-out edge follows the hair;
- the caption doesn't cover the mouth (if it does, the face was filmed too low; say so);
- every word is readable and nothing is cut off.

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 5. Hand over

Tell the user where the file is (`output/glass-ribbon.mp4`) and that it is ready to post. Music can be added in the Instagram/TikTok app.

## Rules

- A price, phone number or offer goes in a `caption`, `pill`, `card` or `step`; all of them sit inside the area no app buttons cover. Never rely on the ribbon or orbs to carry meaning.
- Use only the fonts bundled in `SKILL_DIR/fonts` (they have Ө ө Ү ү). Don't swap in other fonts.
- Captions stay white with no pop or bounce; only the starred word changes font.
- The cut-out model (`SKILL_DIR/models/selfie_segmenter.tflite`, Google MediaPipe, Apache-2.0) is bundled; nothing is uploaded anywhere.
- The output is 1080x1920, 30 fps, H.264, sound normalised to -14 LUFS (Instagram/TikTok level).
