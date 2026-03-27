```markdown
# Poem Studio — concept & architecture

## What it does
A unified tool that takes a raw poem plus optional reference images and audio samples, and outputs:
- A polished poem (meter, rhythm, word choice, imagery, natural rhyme)
- Inline annotations (emotional stage notes, craft observations per passage)
- Stanza-by-stanza Midjourney image prompts (informed by the poem + reference images)
- A narration script with per-line emotional performance cues for ElevenLabs (informed by reference audio)

Everything informs everything — the images shape the edit, the audio shapes the voice direction, the poem's arc unifies all outputs.

## Inputs
- Raw poem (text)
- Reference images (optional) — mood, palette, visual world
- Audio samples (optional) — voice tone, pacing, emotional register

## Outputs
| Tab | Contents |
|-----|----------|
| Polished poem | Edited poem + annotated passages with emotional stage labels |
| Midjourney prompts | One prompt per stanza, copyable |
| Narration script | Line-by-line with [cue] directions for voice talent or TTS |

## Architecture
- Frontend: single HTML artifact (or webpage) — poem input, file drop zones for images/audio, tabbed output panels
- Brain: Claude API (`claude-sonnet-*`) — single prompt pass, returns structured JSON with all four output types
- Proxy: lightweight local server forwarding requests to Anthropic (CORS workaround for browser sandbox)
- External: Midjourney (manual or API), ElevenLabs (API or UI) — fed by the artifact's outputs

## API prompt shape
System: poet-editor role, return JSON only
Response schema:
{
  "polished": "string",
  "annotations": [{ "lines", "stage", "note" }],
  "midjourney_prompts": [{ "stanza", "lines", "prompt" }],
  "narration_script": [{ "lines", "cue", "text" }]
}

## Extension ideas
- Feed Midjourney prompts directly to image gen API, display inline
- Pipe narration script to ElevenLabs, embed audio player per stanza
- Export as a single webpage: poem + images + audio playback
- Add voice cloning: upload a sample, ElevenLabs matches it for narration
- Version history: compare drafts side by side
```
