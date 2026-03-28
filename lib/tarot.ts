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

// ─── Minor Arcana ─────────────────────────────────────────────────────────────

const m = (
  index: number, position: number, name: string, suit: Suit,
  voices: Voice[], poem: string, source: string,
): TarotCard => ({ index, position, name, suit, voices, poem, source });

export const WANDS: TarotCard[] = [
  m(22, 1, 'Ace of Wands', 'wands', ['whitman'],
    `Something is about to begin—
can you feel it, the ignition in the palm,
the whole tree of fire in one branch?

This is the moment before the sentence.
The word is forming.
Your hand is already open.`, 'docs/tarot/ace-of-wands.md'),

  m(23, 2, 'Two of Wands', 'wands', [],
    `You have come this far—
the world is a small thing in your hands,
and the horizon is also small,
and still you want it.

The second staff is just a place to lean
while you decide.`, 'docs/tarot/two-of-wands.md'),

  m(24, 3, 'Three of Wands', 'wands', [],
    `The ships have gone.
Now comes the watching.

Three staffs in the earth—
a railing to grip while the future
does its slow work.

You sent something out.
Wait.`, 'docs/tarot/three-of-wands.md'),

  m(25, 4, 'Four of Wands', 'wands', [],
    `Under the garland—
the fruit still hanging,
the people still lifting their hands—

this is what you built it for:
the moment it holds everyone
at once.`, 'docs/tarot/four-of-wands.md'),

  m(26, 5, 'Five of Wands', 'wands', ['blake'],
    `Five of them, all fighting,
and none of them sure what for—

This is not war.
This is the argument
that makes the idea stronger.

Contest is a kind of love.
Nobody told them this.
Nobody needs to.`, 'docs/tarot/five-of-wands.md'),

  m(27, 6, 'Six of Wands', 'wands', [],
    `The wreath sits oddly
on someone who wasn't sure
they'd make it.

The crowd is genuine.
The crowd is also
already thinking of something else.

Wear it while it's warm.`, 'docs/tarot/six-of-wands.md'),

  m(28, 7, 'Seven of Wands', 'wands', [],
    `Six of them below
and you above
and still it isn't enough.

It's never enough.

But the high ground is yours.
Hold it.`, 'docs/tarot/seven-of-wands.md'),

  m(29, 8, 'Eight of Wands', 'wands', ['hopkins'],
    `Eight wands in flight—
no hand, no archer, all motion—
the message is already there
before you've sent it—

O the speed! the unimpeded
arrow-rush of the decided!`, 'docs/tarot/eight-of-wands.md'),

  m(30, 9, 'Nine of Wands', 'wands', [],
    `Wounded.
Still here.

The bandage shows.
The grip on the staff shows.
The eyes that have seen this before
show.

One more time.`, 'docs/tarot/nine-of-wands.md'),

  m(31, 10, 'Ten of Wands', 'wands', [],
    `Too much.
He knows it.
The village is right there—
he can see it—

and still the load
bends him
toward the ground.

Almost there is its own kind of far.`, 'docs/tarot/ten-of-wands.md'),

  m(32, 11, 'Page of Wands', 'wands', [],
    `The news is exciting.
The Page doesn't know yet
if it's good.

The salamander on his back
knows fire.
The Page knows only
that he has something
to deliver.`, 'docs/tarot/page-of-wands.md'),

  m(33, 12, 'Knight of Wands', 'wands', [],
    `He doesn't slow down
for terrain.

The horse doesn't either.

This is either courage
or the specific blindness
that looks like it.

The desert doesn't care.`, 'docs/tarot/knight-of-wands.md'),

  m(34, 13, 'Queen of Wands', 'wands', [],
    `The sunflower turns toward her
not because it has to—
because it wants to.

The black cat at her feet
chose this.

Everything in this garden
is here
because she made it
somewhere worth being.`, 'docs/tarot/queen-of-wands.md'),

  m(35, 14, 'King of Wands', 'wands', [],
    `He has been the fire and the ash—
he knows what burns and what remains.

The salamanders in his cloak
are not afraid.
Flames don't frighten
what was made of them.

What he builds, he builds
to last past himself.`, 'docs/tarot/king-of-wands.md'),
];

export const CUPS: TarotCard[] = [
  m(36, 1, 'Ace of Cups', 'cups', ['sappho'],
    `The cup—
full, and still filling—
the dove descending—
the hand that offers—

beloved—

even the water
trembles
at the brim`, 'docs/tarot/ace-of-cups.md'),

  m(37, 2, 'Two of Cups', 'cups', ['sappho'],
    `You looked up
at the same moment.

There is a name for this—
the Greeks had it—
the recognition
that was always already
there—

the cups raised.
the eyes.`, 'docs/tarot/two-of-cups.md'),

  m(38, 3, 'Three of Cups', 'cups', [],
    `Three women, lifted cups,
the harvest behind them—

this is not a metaphor.
The grapes are real.
The laughing is real.
The arms around each other
are real.

Some joy doesn't need
to mean anything else.`, 'docs/tarot/three-of-cups.md'),

  m(39, 4, 'Four of Cups', 'cups', [],
    `Three on the ground.
One held out by a cloud.

He doesn't see it.
He is too busy
not wanting
what he has.

The cloud is patient.
The cloud has done this before.`, 'docs/tarot/four-of-cups.md'),

  m(40, 5, 'Five of Cups', 'cups', ['rumi'],
    `Three are spilled.
Stand there and weep—
the reed cut from the reed bed
weeps—

but turn:
two cups remain.
The bridge holds.
The river passes under.

Longing is not the same
as empty.`, 'docs/tarot/five-of-cups.md'),

  m(41, 6, 'Six of Cups', 'cups', ['keats'],
    `A child offering flowers—
how the sweetness of that gesture
never fully leaves—

the old town, the stone gate,
the garden where you were
given something freely—

nothing has been taken.
Only placed
a little further back.`, 'docs/tarot/six-of-cups.md'),

  m(42, 7, 'Seven of Cups', 'cups', [],
    `Seven castles. Seven dragons.
Seven faces in the mist.

Choose one and it becomes real.
The others dissolve.

This is not a warning.
It might be a warning.`, 'docs/tarot/seven-of-cups.md'),

  m(43, 8, 'Eight of Cups', 'cups', [],
    `He stacked them carefully.
Eight cups, all in order.

Then he walked away.
At night. Toward the mountain.
Under a moon that watched
but didn't ask why.

Some questions answer themselves
by moonlight.`, 'docs/tarot/eight-of-cups.md'),

  m(44, 9, 'Nine of Cups', 'cups', [],
    `He sits before them—
all nine—
arms crossed,
smiling that particular smile.

He got what he wanted.

Ask him if it's enough.
Watch his face.`, 'docs/tarot/nine-of-cups.md'),

  m(45, 10, 'Ten of Cups', 'cups', [],
    `The rainbow arrives
when you've stopped
looking for it—

two children spinning—
two people with arms raised—
the house at the edge of the field—

this is what the cards
have been building toward.

Let yourself believe it.`, 'docs/tarot/ten-of-cups.md'),

  m(46, 11, 'Page of Cups', 'cups', [],
    `The fish looked out from the cup
and the Page looked in—

both surprised.
Both willing.

Some messages arrive
from places
we didn't know were sending.`, 'docs/tarot/page-of-cups.md'),

  m(47, 12, 'Knight of Cups', 'cups', [],
    `He comes with his offering—
the cup held steady
even at the gallop—

you could mistake this
for romance.

It is romance.
It is also a choice
arriving at your door
dressed as a feeling.`, 'docs/tarot/knight-of-cups.md'),

  m(48, 13, 'Queen of Cups', 'cups', [],
    `She does not look at you.
She looks at the cup—
what it holds,
what it might hold—

the throne is on the shore
because she knows
where water lives.

She will not tell you
what she sees.
She will show you
how to look.`, 'docs/tarot/queen-of-cups.md'),

  m(49, 14, 'King of Cups', 'cups', [],
    `The sea moves around him.
He does not move.

A fish leaps in the distance.
A ship on the right.
Everything in motion
except the one
who holds the cup
and knows the water
by heart.`, 'docs/tarot/king-of-cups.md'),
];

export const SWORDS: TarotCard[] = [
  m(50, 1, 'Ace of Swords', 'swords', [],
    `The crown at the tip—
olive, palm—
the blade that can cut
either way—

truth is not kind.
Truth is not cruel.

It is simply
what remains
after everything else
has been removed.`, 'docs/tarot/ace-of-swords.md'),

  m(51, 2, 'Two of Swords', 'swords', [],
    `Blindfolded.
Both swords balanced.
The sea behind her
full of rocks.

She chose this.

The choice not to choose
is also a choice,
and the tide
is coming in.`, 'docs/tarot/two-of-swords.md'),

  m(52, 3, 'Three of Swords', 'swords', [],
    `Three swords through the heart—
and rain—
and clouds—

no mystery here.
No symbol.

Some pain
is exactly
what it looks like.`, 'docs/tarot/three-of-swords.md'),

  m(53, 4, 'Four of Swords', 'swords', ['rilke'],
    `The knight lies down.
Not defeated—
resting.

The sword beneath him,
the three above—
the window letting in
a thin gold light—

even the warrior
must learn
the discipline of stillness—
the inward work
that looks, from outside,
like nothing at all.`, 'docs/tarot/four-of-swords.md'),

  m(54, 5, 'Five of Swords', 'swords', [],
    `He picked up the swords.
All of them.
The others walked away.

He won.

Look at his face.
Look at what winning
did to it.`, 'docs/tarot/five-of-swords.md'),

  m(55, 6, 'Six of Swords', 'swords', [],
    `The ferryman doesn't ask.
The woman doesn't speak.
The child is held.

The water ahead is calmer
than the water behind.

This is enough.
This is, in fact,
everything.`, 'docs/tarot/six-of-swords.md'),

  m(56, 7, 'Seven of Swords', 'swords', [],
    `He thinks no one is watching.
He takes five, leaves two.

He is almost right.

The tent behind him
holds the people
who will notice
the missing weight
of what he carries.`, 'docs/tarot/seven-of-swords.md'),

  m(57, 8, 'Eight of Swords', 'swords', [],
    `Eight swords around her.
None of them touching.

Bound. Blindfolded.
The path out
visible to everyone
but her.

She built this
one conviction at a time.`, 'docs/tarot/eight-of-swords.md'),

  m(58, 9, 'Nine of Swords', 'swords', ['dickinson'],
    `Waking at three—
the mind—its own Assassin—
each thought a blade—

Not the future—
not the past—
this—

Now—and now—and now—
the ceiling knows
nothing—

and still the dark
persists—`, 'docs/tarot/nine-of-swords.md'),

  m(59, 10, 'Ten of Swords', 'swords', [],
    `Face down.
Ten swords in the back.
The sky on the horizon
is actually beautiful.

This is the bottom.
You can tell
because there is nowhere
further down.

The dawn
doesn't care
that you didn't ask for it.`, 'docs/tarot/ten-of-swords.md'),

  m(60, 11, 'Page of Swords', 'swords', [],
    `The wind moves everything—
the clouds, the hair—
the sword raised
not to strike
but to test the air—

What's coming?

She already knows.
She has been watching
since before
you arrived.`, 'docs/tarot/page-of-swords.md'),

  m(61, 12, 'Knight of Swords', 'swords', [],
    `He comes through the storm—
the birds scatter—
the trees bend—

he has decided
and the deciding
is the arriving—

there is no space between
his thought
and the ground it hits.`, 'docs/tarot/knight-of-swords.md'),

  m(62, 13, 'Queen of Swords', 'swords', [],
    `One hand raised.
Butterfly at the throne.
The clouds behind her
are also her.

She has known grief.
She kept the blade.
She put down the grief.

She will cut away
exactly what needs cutting.
She will not apologize.
She will not enjoy it.`, 'docs/tarot/queen-of-swords.md'),

  m(63, 14, 'King of Swords', 'swords', [],
    `He has read everything.
He has decided.

The butterflies at his throne
don't surprise him—
he knows that intellect
and beauty
are not enemies.

His cut is clean.
It does not waver.
He does not look away.`, 'docs/tarot/king-of-swords.md'),
];

export const PENTACLES: TarotCard[] = [
  m(64, 1, 'Ace of Pentacles', 'pentacles', [],
    `The hand from the cloud—
a coin of gold—
the garden gate—
the mountains past it—

someone is offering you
the material fact
of what you can make—

take it.
notice the gate.
go through.`, 'docs/tarot/ace-of-pentacles.md'),

  m(65, 2, 'Two of Pentacles', 'pentacles', [],
    `He juggles—
the lemniscate of it—
the ships behind him
rise and fall—

this is how you manage
two real things at once:
you keep moving
and you don't
look down.`, 'docs/tarot/two-of-pentacles.md'),

  m(66, 3, 'Three of Pentacles', 'pentacles', [],
    `Three of them, looking at the plan—
the stone arch above,
the work begun below.

No one here alone.

The monk brought the vision.
The architect brought the measure.
The mason brings his hands.

What they're building
will outlast all three.`, 'docs/tarot/three-of-pentacles.md'),

  m(67, 4, 'Four of Pentacles', 'pentacles', [],
    `One on the crown.
One under each foot.
One held tight to the chest.

He keeps them safe.

The city behind him—
the people behind him—
hold nothing
he recognizes as his.`, 'docs/tarot/four-of-pentacles.md'),

  m(68, 5, 'Five of Pentacles', 'pentacles', [],
    `Snow. Two figures.
The lit window above them.
The gold inside
they cannot touch.

They are together
in the cold.

That is something.
That is not nothing.`, 'docs/tarot/five-of-pentacles.md'),

  m(69, 6, 'Six of Pentacles', 'pentacles', [],
    `The scale balanced.
One hand gives.
The other hand gives.

The merchant has enough.
He knows this.

The knowing is the rarest
of his possessions.`, 'docs/tarot/six-of-pentacles.md'),

  m(70, 7, 'Seven of Pentacles', 'pentacles', [],
    `He leans on the hoe.
Six coins in the vine.
One on the ground.

It has been a long season.

The coins don't ripen faster
for being watched.
He watches anyway.
It's all he knows to do
with hope.`, 'docs/tarot/seven-of-pentacles.md'),

  m(71, 8, 'Eight of Pentacles', 'pentacles', ['hopkins'],
    `Hammer to coin—
eight times, each time
a little better—

O the patient! the recurring
love of the made thing!
the chip-and-stamp
of the becoming-skilled!

He does not tire.
He is becoming.`, 'docs/tarot/eight-of-pentacles.md'),

  m(72, 9, 'Nine of Pentacles', 'pentacles', ['keats'],
    `The falcon on her wrist,
the grapes behind her—
she has made this—
this abundance,
this solitude chosen
over solitude suffered—

the snail on the path,
the ripe things around her,
the evening coming in
amber and sufficient—

she is alone
in the fullest possible sense.`, 'docs/tarot/nine-of-pentacles.md'),

  m(73, 10, 'Ten of Pentacles', 'pentacles', ['yeats'],
    `Three generations under one arch—
the old man at the edge—
the coin-pattern of the full inheritance—

What has been built
does not require
the builder's presence
to stand.

The hounds, the child, the towers—
ceremony of this—

this is what endurance
looks like
from the inside.`, 'docs/tarot/ten-of-pentacles.md'),

  m(74, 11, 'Page of Pentacles', 'pentacles', [],
    `The coin held up—
both hands—
as if for the first time—

which it is.

He has not yet learned
to take the gold
for granted.

Let him hold it
a little longer.`, 'docs/tarot/page-of-pentacles.md'),

  m(75, 12, 'Knight of Pentacles', 'pentacles', [],
    `The horse stands still.
The knight holds the coin
and considers it.

The field behind him
waits.

He will get there.
He always gets there.
He has never once
been first.`, 'docs/tarot/knight-of-pentacles.md'),

  m(76, 13, 'Queen of Pentacles', 'pentacles', [],
    `The rabbit at her feet
chose her.
The flowers leaned in.

She holds the coin
the way you hold
a living thing—
with attention,
without grip.

The garden does not ask permission
to grow toward her.`, 'docs/tarot/queen-of-pentacles.md'),

  m(77, 14, 'King of Pentacles', 'pentacles', [],
    `The vines grow up the throne.
The bull in his coat.
The towers behind him
older than his name.

He did not build this in a day.
He built it in the same days
everyone else had—

the ordinary ones,
applied
without interruption.`, 'docs/tarot/king-of-pentacles.md'),
];

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
