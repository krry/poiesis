# Tarot Poem Tableau — Plan

## Approach

78 poems, one per card. Not quotations. Nearly-accurate renditions — poems written
in the *voice* and *frequency* of pre-Mickey-Mouse poets, channeled to each card's
energy. Feel over thought. No academic treatment, no attribution footnotes.

## Voice Map

| Voice | Quality | Cards it suits |
|-------|---------|----------------|
| Dickinson | slant, compressed, dash-cut | High Priestess, Death, Hermit, Moon, 9 of Swords |
| Whitman | rolling, embodied, cataloguing | Fool, Sun, World, Empress, Ace of Wands |
| Blake | visionary fury, contraries | Devil, Tower, Magician, Justice, Tyger-cards |
| Keats | sensory fullness, ache | Empress, Star, 6 of Cups, Temperance, 9 of Pentacles |
| Hopkins | sprung, dense, ecstatic | Chariot, Wheel, Strength, 8 of Wands |
| Yeats | ceremony, wildness, dread | Hierophant, Lovers, Judgement, 10 of Pentacles |
| Sappho (via feel) | fragment, desire, presence | Ace of Cups, 2 of Cups, Lovers |
| Rilke (via feel) | inward turn, the angel, the wound | Hanged Man, Hermit, 4 of Swords |
| Rumi (via feel) | longing, burning reed | Fool, Star, 5 of Cups |

## Order

1. Major Arcana first (22) — these set the register
2. Wands (14) — fire, drive, spark
3. Cups (14) — water, feeling, dream
4. Swords (14) — air, mind, wound
5. Pentacles (14) — earth, body, work

## Status

- [x] Major Arcana 0–9 (10 poems — my voice, not tuned — may revise or replace)
- [x] Major Arcana 10–21 (12 poems — voice-mapped)
- [ ] Wands 14
- [ ] Cups 14
- [ ] Swords 14
- [ ] Pentacles 14

## Catalog

`lib/tarot.ts` — typed TypeScript catalog of the full 78-card deck.
- `TAROT` — full deck array (22 written + 56 stubs)
- `MAJOR_ARCANA`, `WANDS`, `CUPS`, `SWORDS`, `PENTACLES` — by suit
- `getCard(name)`, `getCardsByVoice(voice)`, `getWrittenCards()`, `getUnwrittenCards()`

## Form rule

Form = frequency. The Tower is fragments. The High Priestess is silence and lacunae.
The Wheel of Fortune returns to its opening image. The Chariot is one long held tension.
Don't explain. Don't describe. Be the card.
