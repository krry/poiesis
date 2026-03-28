export type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
export type Voice =
  | 'dickinson'
  | 'whitman'
  | 'blake'
  | 'keats'
  | 'hopkins'
  | 'yeats'
  | 'sappho'
  | 'rilke'
  | 'rumi';

export interface TarotCard {
  /** 0–77 across the full deck */
  index: number;
  /** Position within suit: 0–21 for major arcana, 1–14 for minor */
  position: number;
  name: string;
  suit: Suit;
  voices: Voice[];
  poem: string | null;
  /** Relative path to the source markdown file in docs/tarot/ */
  source: string | null;
}

const major = (
  position: number,
  name: string,
  voices: Voice[],
  poem: string,
  source: string,
): TarotCard => ({ index: position, position, name, suit: 'major', voices, poem, source });

const stub = (
  index: number,
  position: number,
  name: string,
  suit: Suit,
  voices: Voice[],
): TarotCard => ({ index, position, name, suit, voices, poem: null, source: null });

// ─── Major Arcana ────────────────────────────────────────────────────────────

export const MAJOR_ARCANA: TarotCard[] = [
  major(0, 'The Fool', ['whitman', 'rumi'],
    `One step off the cliff—
not yet falling,
just the bright pause
before the world
remembers gravity.

The dog knows.
The dog always knows.`,
    'docs/tarot/the-fool.md'),

  major(1, 'The Magician', ['blake'],
    `What the hand holds:
fire, water, air, stone—
the table spread
and everything beginning.

Say the word.
Watch it be.`,
    'docs/tarot/the-magician.md'),

  major(2, 'The High Priestess', ['dickinson'],
    `Between the pillars—
what she knows
she will not say.

The scroll, half-rolled.
The pomegranates behind the veil.

Ask her anything.
She opens like water.
She says nothing.`,
    'docs/tarot/the-high-priestess.md'),

  major(3, 'The Empress', ['whitman', 'keats'],
    `Everything wants to grow here.
The wheat leans toward her.
The river knows her name.

She is not waiting.
She is already
full of what will come.`,
    'docs/tarot/the-empress.md'),

  major(4, 'The Emperor', [],
    `Stone upon stone.
The throne has always been here.
The mountains agree.

He did not ask for this.
He did not refuse it either.

Order is a kind of love.`,
    'docs/tarot/the-emperor.md'),

  major(5, 'The Hierophant', ['yeats'],
    `These words were given
to those before us,
who gave them to us,
who give them to you now.

Kneel or don't.
The door is the same door.`,
    'docs/tarot/the-hierophant.md'),

  major(6, 'The Lovers', ['yeats', 'sappho'],
    `Before the answer—
this exact moment,
when both roads
still lead somewhere beautiful.

The angel has seen this before.
The angel says nothing.`,
    'docs/tarot/the-lovers.md'),

  major(7, 'The Chariot', ['hopkins'],
    `Opposite horses, one direction.
The sphinxes disagree
and still the wheels turn.

Will is not the absence of tension.
Will is the harness.`,
    'docs/tarot/the-chariot.md'),

  major(8, 'Strength', ['hopkins'],
    `She opens the mouth of it
the way you open
a jar of summer:

slowly,
without forcing,
because you know
it will give.`,
    'docs/tarot/strength.md'),

  major(9, 'The Hermit', ['dickinson', 'rilke'],
    `The lantern shows
only as far as the next step.

That's enough.
That's always been enough.

He has walked a long time
to learn this.`,
    'docs/tarot/the-hermit.md'),

  major(10, 'Wheel of Fortune', ['hopkins'],
    `All turns: the year turns, the worm turns,
the king turns beggar—

O the hub! to be the hub!
the still point while the fortune-spokes fly!

But you are the rim.
You have always been the rim.

All turns: the worm turns, the year turns.`,
    'docs/tarot/wheel-of-fortune.md'),

  major(11, 'Justice', ['blake'],
    `The sword is not punishment—
it is the shape of the question.

Everything weighed against
the feather of what you meant.

The scales have no mercy.
The scales have no cruelty.
The scales have both.`,
    'docs/tarot/justice.md'),

  major(12, 'The Hanged Man', ['rilke'],
    `From here the world is a little changed—

The blood collects in the head
like a thought you've been meaning to think.

The world below continues.

There is nothing required of you here.
There is only looking—
the strange brightness past the knees—
the rope, patient above—
the long slow learning
of a different direction.`,
    'docs/tarot/the-hanged-man.md'),

  major(13, 'Death', ['dickinson'],
    `He did not hurry—
He never does—

The wheat had just come in—
The children—gone to school—

Such ordinary curtains
to step behind—

Such ordinary light
to leave—`,
    'docs/tarot/death.md'),

  major(14, 'Temperance', ['keats'],
    `Between the cups, a pouring—
not from one to one, but through—

The water takes the shape of patience.

The angel has done this
a thousand years
and still the water spills a little—
still the moment trembles—
still the light hits the stream
that same impossible gold.`,
    'docs/tarot/temperance.md'),

  major(15, 'The Devil', ['blake'],
    `They chose the chains.
The loops are wide enough
to slip the wrists through—

They have forgotten this.
They have learned to call the chain a necklace.

Energy is Eternal Delight, wrote the angel—
from the wall where he was chained—
calling the chain a crown—

Tell me: who bound whom?`,
    'docs/tarot/the-devil.md'),

  major(16, 'The Tower', ['blake'],
    `The lightning—

before you understand—

already through—

—the walls had been—

—the crown falling—

—the figures in air—

open sky where the ceiling was—

not ruin—

                        relief—`,
    'docs/tarot/the-tower.md'),

  major(17, 'The Star', ['rumi', 'keats'],
    `The woman at the water's edge
pours from one vessel into the river,
one into the earth—

giving everything back.

She is not praying.
She is not hoping.
She is here
at this hour
becoming the answer
to a question
she hasn't asked yet.`,
    'docs/tarot/the-star.md'),

  major(18, 'The Moon', ['dickinson'],
    `The path goes on—
or seems to—

The dogs have something to say
about this light—
so do the towers—

The pool has been here
longer than the path—

Something crawls out—

Not toward danger—
toward the moon—
which is not the sun—
which knows this—`,
    'docs/tarot/the-moon.md'),

  major(19, 'The Sun', ['whitman'],
    `I celebrate the child on the white horse—
the sunflowers, the wall,
the bare skin, the lifted arms!

I am the warmth that asks nothing.
I am the light that keeps no record.

Every shadow I have made I have lifted.
Every seed I have opened.

Look: the child's face.
Look: the arms wide.
Look: the horse already knows where it's going.`,
    'docs/tarot/the-sun.md'),

  major(20, 'Judgement', ['yeats'],
    `The trumpet has not asked for your readiness—

The dead rise without revision.
The angel's face
too large for what you thought the sky could hold.

They rise with arms open—
having been so long not open—

And the child is already there,
having never forgotten.

The sound does not stop for wonder.`,
    'docs/tarot/judgement.md'),

  major(21, 'The World', ['whitman'],
    `I have been the water and the fire—
I have been the eagle and the bull—
I have walked the ring of my own becoming—

The wreath holds but does not bind.
The dancer turns but does not end.
The four corners lean in.

All of it—the wound and the welcoming—
all of it goes into the dance—

This is what completion sounds like.

The turning
    and turning
        that becomes stillness—`,
    'docs/tarot/the-world.md'),
];

// ─── Minor Arcana stubs ───────────────────────────────────────────────────────
// Voices assigned per the plan's voice map; poems null until written.

const WAND_NAMES = [
  'Ace of Wands', 'Two of Wands', 'Three of Wands', 'Four of Wands',
  'Five of Wands', 'Six of Wands', 'Seven of Wands', 'Eight of Wands',
  'Nine of Wands', 'Ten of Wands', 'Page of Wands', 'Knight of Wands',
  'Queen of Wands', 'King of Wands',
];
const CUP_NAMES = [
  'Ace of Cups', 'Two of Cups', 'Three of Cups', 'Four of Cups',
  'Five of Cups', 'Six of Cups', 'Seven of Cups', 'Eight of Cups',
  'Nine of Cups', 'Ten of Cups', 'Page of Cups', 'Knight of Cups',
  'Queen of Cups', 'King of Cups',
];
const SWORD_NAMES = [
  'Ace of Swords', 'Two of Swords', 'Three of Swords', 'Four of Swords',
  'Five of Swords', 'Six of Swords', 'Seven of Swords', 'Eight of Swords',
  'Nine of Swords', 'Ten of Swords', 'Page of Swords', 'Knight of Swords',
  'Queen of Swords', 'King of Swords',
];
const PENTACLE_NAMES = [
  'Ace of Pentacles', 'Two of Pentacles', 'Three of Pentacles', 'Four of Pentacles',
  'Five of Pentacles', 'Six of Pentacles', 'Seven of Pentacles', 'Eight of Pentacles',
  'Nine of Pentacles', 'Ten of Pentacles', 'Page of Pentacles', 'Knight of Pentacles',
  'Queen of Pentacles', 'King of Pentacles',
];

// Voice hints from plan (partial — fill in as poems are written)
const WAND_VOICES: Voice[][] = [
  ['whitman'], [], [], [], [], [], [], ['hopkins'], [], [], [], [], [], [],
];
const CUP_VOICES: Voice[][] = [
  ['sappho'], ['sappho'], [], [], ['rumi'], ['keats'], [], [], [], [], [], [], [], [],
];
const SWORD_VOICES: Voice[][] = [
  [], [], [], ['rilke'], [], [], [], [], ['dickinson'], [], [], [], [], [],
];
const PENTACLE_VOICES: Voice[][] = [
  [], [], [], [], [], [], [], [], ['keats'], ['yeats'], [], [], [], [],
];

const makeMinor = (
  names: string[],
  suit: Suit,
  voiceHints: Voice[][],
  startIndex: number,
): TarotCard[] =>
  names.map((name, i) => stub(startIndex + i, i + 1, name, suit, voiceHints[i] ?? []));

export const WANDS = makeMinor(WAND_NAMES, 'wands', WAND_VOICES, 22);
export const CUPS = makeMinor(CUP_NAMES, 'cups', CUP_VOICES, 36);
export const SWORDS = makeMinor(SWORD_NAMES, 'swords', SWORD_VOICES, 50);
export const PENTACLES = makeMinor(PENTACLE_NAMES, 'pentacles', PENTACLE_VOICES, 64);

// ─── Full deck ────────────────────────────────────────────────────────────────

export const TAROT: TarotCard[] = [
  ...MAJOR_ARCANA,
  ...WANDS,
  ...CUPS,
  ...SWORDS,
  ...PENTACLES,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCard(name: string): TarotCard | undefined {
  return TAROT.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function getCardsByVoice(voice: Voice): TarotCard[] {
  return TAROT.filter(c => c.voices.includes(voice));
}

export function getCardsBySuit(suit: Suit): TarotCard[] {
  return TAROT.filter(c => c.suit === suit);
}

export function getWrittenCards(): TarotCard[] {
  return TAROT.filter(c => c.poem !== null);
}

export function getUnwrittenCards(): TarotCard[] {
  return TAROT.filter(c => c.poem === null);
}
