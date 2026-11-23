# Interactive and Branching Narrative Design: What Makes Reader-Driven Stories Satisfying

Research date: 2026-11-23. Scope: design principles from tabletop game-mastering, interactive fiction, gamebooks, narrative video games and interactive-storytelling research, filtered for an improvising AI narrator that writes 2-5 sentences per turn and offers exactly three choices (DreamWeaver).

Reading notes for the report writer:

- **[P]** marks practitioner wisdom (designer essays, talks, rulebooks). **[R]** marks academic research or a research system. Almost everything in this field is practitioner wisdom; I found very little controlled empirical evidence, and say so in the Gaps.
- **Verification level.** "Fetched" means I read the page (through a summarising fetch tool, so short quotes are reliable but should be treated as extracts, not full transcripts). "Full text" means I extracted and read the PDF text myself. "Search snippet" means I only saw a search-result excerpt and the claim is weaker.
- "Inferences" are mine, not the sources'. They are where the DreamWeaver-specific rules live.

---

## 1. Meaningful choice: what makes a choice feel meaningful

### Takeaway
Across sources, a choice feels meaningful when the reader (a) has some basis for choosing, (b) sees the story acknowledge and remember the choice, (c) faces options with no obviously best answer, and (d) can express who their character is. Illusory choices are accepted practice when the reader cannot tell, or when the choice is expressive rather than plot-steering; what breaks trust is promising consequences and not delivering.

### Cited Findings

**Sid Meier, "Interesting Decisions" (GDC 2012) [P]**
- Meier's often-quoted definition, first given at GDC 1989, is "A game is a series of interesting decisions"; the 2012 talk revisited what makes a decision interesting (search snippet). — [Game Developer, GDC 2012 report](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- He defines the idea by its negative: "It's easier to look at it as what is not an interesting decision." A choice where the player always takes the first option, or picks at random, is not interesting (fetched). — [Game Developer](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- "Good decisions are situational": the choice should interact with the current state of the game. Interesting decisions also "allow you to express your personal play style", and can be persistent (shape the game for a while), provided the player has enough information (fetched). — [Game Developer](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- Decision types he names: risk versus reward, short-term versus long-term, and customisation (even naming a city makes players "more connected to the game that they're playing") (fetched). — [Game Developer](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- On information: "It's almost worth erring on the side of providing the player with too much information." Familiar genres and settings reduce how much has to be explained (fetched). — [Game Developer](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- On feedback: "The worst thing you can do is just move on." Even a small acknowledgement that the game registered the choice helps (fetched). — [Game Developer](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- On density: too many complex decisions in a row make players feel out of control; too few leave them bored. "Be ruthless in terms of cutting things out," and "You don't want to forget that your game is more than just decisions" (fetched). — [Game Developer](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- A separate summary lists Meier's four qualities as tradeoffs, situational, personal and persistent, and quotes his caveat that "something that's interesting you do once doesn't mean it's something interesting to do ten times" (search snippet only). — [Filament Games summary](https://www.filamentgames.com/blog/sid-meiers-narrative-design-part-one)

**Choice of Games, "5 Rules for Writing Interesting Choices" (Dan Fabulich, 28 March 2010) [P]** — all fetched from [Choice of Games](https://www.choiceofgames.com/2010/03/5-rules-for-writing-interesting-choices-in-multiple-choice-games/)
- Rule 1, every option should have real consequences: "If my decision has no effect on anything, why am I even making a decision?" Consequences need not be a new branch; a change to a tracked variable counts.
- Rule 2, the player needs some basis to make a decision. The opening of the gamebook *Journey Under the Sea* is given as the bad example: two options that look equally exploratory, forcing a random pick. "The goal of a multiple-choice game should be to make the player care about what happens."
- Rule 3, no option should be obviously better or worse than all the others. The fix is to improve the weak options, not to hide information. Even "wrong" choices should entertain: "Make the player say, 'Wow, that was neat!' and not, 'Oops. That was lame.'" "Opt-out" options (stay home rather than go on the adventure) are inherently uninteresting.
- Rule 4, know your players: "Multiple-choice games are role-playing games." Different players want to win, to feel a dramatic story, to see plausible consequences, or to explore what is possible.
- Rule 5, break these rules: fake choices are acceptable when players do not realise they are meaningless, and unfounded choices can invite exploration.

**Choice of Games, "How to Write Intentional Choices" (Becky Slitt, 22 December 2016) [P]** — fetched from [Choice of Games](https://www.choiceofgames.com/2016/12/how-to-write-intentional-choices/)
- "One of our core principles is that choices have to be *meaningful*," and meaning depends on intention: the player must know why they are choosing an option and roughly what it may lead to.
- Intentionality matters most when an option can turn out badly or when options differ in difficulty.
- Old gamebooks that offered only "Go right" or "Go left" forced a random pick; readers who cannot flip back resent it. (This is the "which door" problem named in the brief; the article does not use that exact term.)
- Method: "give clues in the text about the potential story effects and stat effects of each option", either in the narration before the choice or in the option text itself. "The text clarifies the potential risks and rewards of each option."

**Choice of Games, "7 Rules for Designing Great Stats" (Dan Fabulich, 27 July 2011) [P]** — fetched from [Choice of Games](https://www.choiceofgames.com/2011/07/7-rules-for-designing-great-stats/)
- Skill-only options reduce every challenge to "which skill do I use?" and get repetitive.
- Personality-trait choices work like personality-quiz questions: "These questions rarely have a right answer," so players can role-play.
- Moral dilemmas should be ones "where the common rules of morality seem to contradict", tracked as separate virtues rather than a single good/evil score.
- Give the player an expendable resource ("five magic potions, or 200 gold") so that spending it is itself a decision.
- "Present the player with several equally appealing alternatives"; opposing traits (for example Cunning versus Honor) keep options balanced.

**Illusion of choice: the Telltale debate [P, one academic paper]**
- Game Informer's critique (Elise Favis, 3 February 2015): Telltale's main stories "are as linear as The Last of Us, with only small exceptions"; "Characters will die regardless of your choices – it just comes down to when"; "major decisions often don't have lasting consequences". The games advertise "The story is tailored by how you play", which in practice means changed dialogue and relationships, not changed plot. The author still values the games for the characters she came to care about (fetched). — [Game Informer](https://www.gameinformer.com/b/features/archive/2015/02/03/why-your-choices-dont-matter-in-telltale-games.aspx)
- Academic defence (Antranig Arek Sarian, *Eludamos* 9(1), 2018): criticism that the choices "don't matter" "overlooks the ways in which they actually function". The model is "analogous to the philosophical thought experiment", presenting "a sequential series of moral dilemmas that all communicate a common theme"; the choices "may not have any long-term consequences" but "do serve an informative pedagogical function" (abstract only, fetched). — [Eludamos](https://septentrio.uit.no/index.php/eludamos/article/view/vol9no1-2)
- Other commentary splits the same way: Den of Geek calls the "will remember that" message a false promise; GamesBeat and a Game Developer blog argue the illusion of choice does real emotional work; PC Gamer argues the games do adapt, just not by branching (search snippets only). — [Den of Geek](https://www.denofgeek.com/us/games/the-walking-dead/264005/the-walking-dead-false-promises-telltale); [GamesBeat](https://gamesbeat.com/the-illusion-of-player-choice-in-the-walking-dead/); [PC Gamer](https://pcgamer.com/im-over-the-fact-that-choices-dont-really-matter-in-telltale-games)

**Jon Ingold (inkle) on what choices are for [P]**
- Asked how to make choices matter, Ingold's quip was "You don't": choices exist to get players invested and to make them take some ownership of the story (fetched; report of a Writers' Guild of Great Britain talk, 18 February 2021). — [Game Developer](https://gamedeveloper.com/design/should-games-have-meaningful-choices-)
- He opposes total player control: "If a player can just walk into a room and do whatever they want, then what's the point of playing this game?" and "You might as well play with Lego, because Lego does what you tell it to." He prefers stories that respond to choices in surprising ways, citing Meg Jayanth: "Who ever heard of that story where a protagonist gets exactly what they want?" (fetched). — [Game Developer](https://gamedeveloper.com/design/should-games-have-meaningful-choices-)
- In his AdventureX 2018 dialogue talk, the scene's subtext is fixed and the surface text varies: "We assign the subtext as a fixed structure that we are not going to give up"; "If all of the meaningful interaction is happening in the subtext, then the text itself doesn't matter that much" (fetched; Kotaku report, 1 December 2018). — [Kotaku](https://kotaku.com/developer-shows-how-to-write-good-game-dialogue-using-b-1830797912)

### Inferences
- A working test for each of DreamWeaver's three options, combining Meier, Fabulich and Slitt: can the reader say why they would pick it (informed), will the next scene visibly differ because of it (consequential), does it say something about the hero (expressive), and is there a reason to hesitate (difficult)? An option does not need all four, but an option with none is filler.
- "Which door" choices (left path / right path / wait) are the most likely failure mode for an improvising narrator, because they are the cheapest to generate. The fix the sources agree on is to put the stakes or the cost in the option text or in the sentence before it.
- Dilemma versus puzzle: a puzzle has a right answer the reader must find; a dilemma has costs on every side. The Choice of Games rules (no obviously best option, moral rules that contradict, personality questions with no right answer) all push toward dilemmas. For a storybook with no fail state, dilemmas and expressive choices are the natural fit; puzzles with one right answer make two of the three options traps.
- Illusion is acceptable under two conditions drawn from the Telltale debate and Fabulich's Rule 5: the reader cannot tell the choice was cosmetic, and the system has not explicitly promised a consequence. A generative narrator has less need for illusion than Telltale did, because honouring a choice costs it nothing in production; its risk is the opposite one, forgetting.
- Meier's "the worst thing you can do is just move on" translates directly: the first sentence of each new scene should show the result of the choice just made.

### Gaps
- I could not access the GDC Vault recording of Meier's talk; the above relies on a press report and secondary summaries. The four-quality list (tradeoffs, situational, personal, persistent) is from a search snippet only.
- I found no controlled studies in this pass measuring which properties of a choice raise reader satisfaction. The claims above are practitioner consensus, not experimental findings.
- The Sarian paper was read as an abstract only.

---

## 2. Agency versus authored arc

### Takeaway
The standard reconciliation is to let choices change state rather than fork the plot: branches rejoin at shared events, and remembered state colours what happens there (branch-and-bottleneck, "delayed branching"). Research frames the same problem as a manager that steers toward a good overall shape while the reader keeps moment-to-moment freedom.

### Cited Findings

**Sam Kabo Ashwell, "Standard Patterns in Choice-Based Games" (26 January 2015) [P]** — all fetched from [These Heterogenous Tasks](https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/)
- Time Cave: "a heavily-branching sequence" with little re-merging and no state-tracking. Playthroughs are short and "strongly encourage replay"; players "will probably miss a good deal of the content"; the player has "velocity but little grasp".
- Gauntlet: "long rather than broad", a mostly linear thread with side branches that end, loop back or rejoin quickly. "Perhaps the easiest structure to author", but players are "likely to realise that they are on a constrained path".
- Branch and Bottleneck: "The game branches, but the branches regularly rejoin, usually around events that are common to all versions of the story." It lets the player build "a somewhat-distinctive story and/or personality", relies on "heavy use of state-tracking", and is "heavily governed by the passage of time".
- Quest: distinct branches that "tend to rejoin to reach a relatively small number of winning endings"; suits "journeys of exploration"; can feel "fragmentary or episodic"; organised by geography rather than time.
- Open Map: reversible travel between nodes; the player "has more leisure to explore and grasp the world", but the story can become "slower-paced and less directed".
- Sorting Hat: early branching and rejoining that determines "which major branch the player gets assigned to".
- Floating Modules: "There is no tree"; encounters become available by state or chance. "A challenging style to write for"; without enough content it "tends to collapse into a linear system".
- Loop and Grow: a central thread that "loops around, over and over, to the same point", with state unlocking new options each time; "emphasizes the regularity of the world while retaining narrative momentum".

**Choice of Games, "By the Numbers: How to Write a Long Interactive Novel That Doesn't Suck" (Dan Fabulich, 27 July 2011) [P]** — fetched from [Choice of Games](https://www.choiceofgames.com/2011/07/by-the-numbers-how-to-write-a-long-interactive-novel-that-doesnt-suck/)
- Pure branching is exponential: with two options per page, a seven-page story needs 128 pages, and a twenty-page story would need a book "more than a million pages long".
- Naive merging has a cost: "Merging branches like this robs the interactive novel of its interactivity."
- Their answer is delayed branching: early choices do not fork the story at once; they set stats that decide the outcome of later events. Example: a Brutality-or-Finesse choice in chapter 1 of *Choice of the Dragon* decides whether the dragon later wins by duel or by trap. The games are structurally linear, chapter to chapter.
- Rule of thumb: "Every chapter should change the stats and test them to make earlier decisions meaningful."
- Referring back to one specific earlier choice is used sparingly because "if you use it too much, your story quickly becomes too complex to write."

**Emily Short on structures beyond branching [P]**
- A storylet has three parts: "there is a piece of content", "there are prerequisites that determine when the content can play", and "there are effects on the world state that result after the content has played". Storylets are "simple, atomic, robust, and recombinable" (fetched; 29 November 2019). — [Emily Short, "Storylets: You Want Them"](https://emshort.blog/2019/11/29/storylets-you-want-them/)
- With a progress stat, storylets can reproduce gauntlets, branch-and-bottleneck, sorting hats and loop-and-grow. Example state values: a progress stat for how far through the story the player is, and a menace stat for how much trouble they are in (fetched). — [Emily Short](https://emshort.blog/2019/11/29/storylets-you-want-them/)
- Quality-based narrative lets "a lot of short stories … slot together in interesting ways", but tracking progression needs "a lot of bookkeeping" (fetched; 12 April 2016). — [Emily Short, "Beyond Branching"](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/)
- Salience-based selection (the system picks whichever content "is most applicable at the moment") can misfire dramatically: an ending reached by accident "might be effective and powerful if it were placed by an author" but is "not necessarily guaranteed to be so effective when selected by a salience match" (fetched). — [Emily Short](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/)
- Waypoint narrative pathfinds from whatever the player says back toward authored beats, so the story recovers from unexpected input; the cost is that "the primary responsibility for story progression was on them [the NPCs], not on the player" (fetched). — [Emily Short](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/)

**Failbetter Games (Fallen London) [P]**
- Failbetter describe quality-based narrative as storylets "whose appearance controls and is controlled by changeable state (qualities)" (search snippet). — [Failbetter, StoryNexus developer diary](https://www.failbettergames.com/news/storynexus-developer-diary-2-fewer-spreadsheets-less-swearing)
- Their narrative-engineering post notes that quality-based narrative "isn't good at having a series of things that need to happen in order, unless they're controlled by a single quality" (search snippet). — [Failbetter, "Don't Poke That"](https://www.failbettergames.com/dont-poke-that-narrative-engineering-principles-part-1)
- Writer guidelines (15 April 2015): "Two qualities tends to be the magic minimum number for any content with an engaging interactive structure"; otherwise content risks being a simple chain or a grind. Use as few unique qualities as possible. Players return after breaks, so include reminders of where to go next (fetched). — [Failbetter, Writer Guidelines Part II](https://www.failbettergames.com/news/fallen-london-writer-guidelines-part-ii)

**Inkle / Jon Ingold [P]**
- "I tend to work in scenes", each with one entry and one exit; what varies is how the player moves through it. "It's all there to make you feel like you've been moved through an experience" (fetched). — [Game Developer, 18 February 2021](https://gamedeveloper.com/design/should-games-have-meaningful-choices-)
- On *80 Days*: consequences should be ones the player can plan around; the article contrasts this with *Sorcery!*, where the risk was "surprising the player with consequences for which they can not plan ahead" (fetched; Leigh Alexander, 14 January 2015). — [Game Developer, "Threats, luggage and mild peril"](https://www.gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-)

**Telltale's approach and its criticism [P]** — see section 1. The structural point: Telltale used fixed bottlenecks with relationship and dialogue variation between them, and advertised memory ("X will remember that") more loudly than it delivered it. — [Game Informer](https://www.gameinformer.com/b/features/archive/2015/02/03/why-your-choices-dont-matter-in-telltale-games.aspx)

### Inferences
- DreamWeaver has no authored bottlenecks, so the nearest equivalents are (a) structural beats that every story should pass through regardless of content (an inciting problem, a midpoint turn, a low point, a climax, a resolution) and (b) the open-thread list. The narrator can treat those beats as Ashwell's bottlenecks: any choice is honoured, but the story still arrives at "the problem gets worse" around the middle.
- Ashwell's Time Cave description ("velocity but little grasp") is a fair description of an unmanaged LLM story: everything is possible, nothing accumulates. The story bible is what moves DreamWeaver from Time Cave toward branch-and-bottleneck, and only if the narrator actually tests the recorded state.
- Fabulich's "change the stats and test them" generalises to: every few scenes, something recorded earlier (an item, an ally, a promise, a trait the hero has shown) should decide how a scene turns out.
- Short's progress and menace stats suggest two cheap hidden counters for the story bible: how far through the arc the story is, and how much trouble the hero is in. Section 6 gives the research basis for using them.
- The lesson of "X will remember that" is to under-promise and over-deliver: do not announce that a choice mattered; show it mattering later. An LLM narrator that says "the fox will remember this" and then forgets reproduces Telltale's worst reputation.
- Ingold's fixed-subtext idea suggests that each scene should have one dramatic job (what must change by its end), with the three choices being different ways to do that job rather than three different jobs.

### Gaps
- "Foldback" is the term used in Ernest Adams's game-design textbook for branches that rejoin; I did not locate a citable primary source for it in this pass. Ashwell's "branch and bottleneck" describes the same structure and is cited instead.
- I could not access Ingold's GDC talks ("Adventures in Text", the *Heaven's Vault* talk) on GDC Vault; their content above is from press reports of other talks.
- The two Failbetter findings marked "search snippet" were not read in full.

---

## 3. Consequence and callbacks

### Takeaway
Stories feel shaped when earlier material returns. Johnstone's improv rule is to invent freely and then reincorporate what has been "shelved"; interactive-fiction practice says the same thing in terms of state: record what the reader did, then test it later. Consequences should be foreseeable enough to plan around and should include real costs.

### Cited Findings

**Keith Johnstone, *Impro: Improvisation and the Theatre* (1979; Methuen edition 1981) [P]** — quotes extracted from the full-text copy at the [Internet Archive](https://archive.org/stream/pdfy-KIkLrSPi_3lzPl5v/Keith%20Johnstone-Impro_%20Improvisation%20and%20the%20Theatre-Methuen%20Drama%20%281981%29_djvu.txt) (fetched; partial read of the Narrative Skills and Spontaneity chapters)
- "The improviser has to be like a man walking backwards." He "sees where he has been, but he pays no attention to the future."
- The improviser gives a story shape "by remembering incidents that have been shelved and reincorporating them."
- "What matters to me is the ease with which I 'free-associate' and the skill with which I reincorporate."
- "Content lies in the structure, in what happens, not in what the characters say."
- A secondary source quoting the same chapter adds that audiences often applaud when earlier material is brought back (search snippet). — [improv.org essay](https://www.improv.org/my-story-story/) (page returned 404 when fetched)

**State and delayed consequence [P]**
- Choice of Games: consequences can be a change to a tracked variable, and those variables should later be tested; see sections 1 and 2. — [Choice of Games, By the Numbers](https://www.choiceofgames.com/2011/07/by-the-numbers-how-to-write-a-long-interactive-novel-that-doesnt-suck/)
- Stats should include the world as well as the hero (relationships, reputation, progress toward an event), and expendable resources. — [Choice of Games, 7 Rules](https://www.choiceofgames.com/2011/07/7-rules-for-designing-great-stats/)
- Failbetter: "Be cautious - a string of quality changes in a result makes each one less important." Visible consequences make non-player characters more tangible. "It's fine (often preferable) to hold off giving rewards for a while" and deliver them together at the end of a strand (fetched). — [Failbetter, Writer Guidelines Part II](https://www.failbettergames.com/news/fallen-london-writer-guidelines-part-ii)
- Inkle's *80 Days* used resources that came from the fiction: "We needed resources you could husband, cultivate and nurture, and the plot gave us those for free" (money, luggage, time, and the relationship between the two leads) (fetched). — [Game Developer](https://www.gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-)

**Costs, setbacks and "bad" choices [P]**
- Meg Jayanth (writer of *80 Days*), GDC 2015 talk "Leading Players Astray": "My job as a writer was to tempt players into making bad decisions"; "A bad strategy decision might lead them to a more interesting story"; "It's the near-misses, the catastrophes, the daring escapes that players remember and talk about"; "It's the adventures they weren't expecting to have that make a game memorable" (fetched; second-hand report, 4 March 2015). — [MCV/Develop](https://mcvuk.com/development-news/80-days-writer-tempt-your-players-into-making-bad-decisions/)
- Ingold describes *80 Days* as having "'mild peril' -- the most entertaining kind" (fetched). — [Game Developer](https://www.gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-)

### Inferences
- Johnstone's two-part skill maps onto the two halves of a DreamWeaver story. Early scenes should free-associate: introduce items, characters, places and oddities, and write them into the bible. Later scenes should stop inventing and start reincorporating. A simple rule: after roughly the midpoint, each new scene should reuse at least one thing from the bible before it introduces anything new, and the ending should be built from shelved material only.
- "Walking backwards" is a workable instruction for a narrator with no plot: when unsure what happens next, look at what has already been established rather than inventing a fresh element.
- The carried-items list is the cheapest callback device available. An item picked up in scene 3 that solves or complicates a problem in scene 12 is exactly the Choice of Games delayed-branch pattern. The corollary is that an item which never comes back should not have been recorded.
- Failbetter's warning about strings of changes suggests one notable state change per scene, not several.
- Jayanth's advice supports including a tempting, riskier option among the three, and making sure its setbacks lead somewhere more interesting rather than to a dead end.
- Costs should be paid in things the reader can see in the bible: a lost item, a strained friendship, lost time against a threat. A cost that is not recorded is a cost that will be forgotten.

### Gaps
- The Johnstone quotes come from a machine-read archive copy read in part; page numbers were not captured. Johnstone's related terms from *Impro for Storytellers* ("breaking routines", "cancelling") were not found in the portion read.
- I found no source in this pass that quantifies how often callbacks should occur or how many tracked variables readers can follow.

---

## 4. Game-mastering wisdom from tabletop RPGs

### Takeaway
The tabletop tradition most relevant to an improvising narrator is the Apocalypse World family: no pre-written plot ("play to find out what happens"), a short list of narrator behaviours, soft warnings that become hard consequences if ignored, and threats tracked as clocks. Justin Alexander adds the complementary advice: prepare situations with goal-driven opposition instead of plots, and make every essential discovery reachable three ways.

### Cited Findings

**Dungeon World (Sage LaTorra and Adam Koebel; SRD) [P]** — all fetched from the [Dungeon World SRD, Gamemastering](https://www.dungeonworldsrd.com/gamemastering/)
- GM agenda: "Portray a fantastic world", "Fill the characters' lives with adventure", "Play to find out what happens".
- Principles include: "Draw maps, leave blanks"; "Address the characters, not the players"; "Make a move that follows"; "Never speak the name of your move"; "Give every monster life"; "Name every person"; "Ask questions and use the answers"; "Be a fan of the characters"; "Think dangerous"; "Begin and end with the fiction"; "Think offscreen, too".
- GM moves include: "Reveal an unwelcome truth"; "Show signs of an approaching threat"; "Use up their resources"; "Turn their move back on them"; "Separate them"; "Offer an opportunity, with or without cost"; "Put someone in a spot"; "Tell them the requirements or consequences and ask".
- When to make a move: "When everyone looks to you to find out what happens", "When the players give you a golden opportunity", and on a failed roll.
- Soft moves are those "without immediate, irrevocable consequences"; hard moves "have immediate consequences". A soft move that is ignored becomes a golden opportunity for a hard move.
- Fronts are "secret tomes of GM knowledge": linked threats, each danger with an impulse (what drives it), a list of grim portents ("dark designs for what could happen if a danger goes unchecked") and an impending doom. Adventure fronts have 2–3 dangers and 1–3 portents each.

**Apocalypse World (D. Vincent Baker and Meguey Baker) [P]**
- "Be a fan of the players' characters" originates as an Apocalypse World MC principle, alongside "barf forth apocalyptica" and "make your move, but never speak its name" (search snippets of secondary commentary; I did not read the rulebook). — [Dice Exploder](https://diceexploder.squarespace.com/blog/2024/4/10/more-on-apocalyptic-principles); [Gnome Stew](https://gnomestew.com/the-gms-agenda-and-principles/)
- Countdown clocks, as quoted from the 2nd edition by a close-reading blog (Jason D'Angelo, 5 November 2017): a clock is "a reminder to you as MC that your threats have impulse, direction, plans, intentions". "When you create a threat, if you have a vision of its future, give it a countdown clock." Stages: "Before 9:00, that thing's coming, but preventable"; "Between 9:00 and 12:00, that thing is inevitable, but there's still time to brace for impact"; "At 12:00, the threat gets its full, active expression." Clocks are both descriptive ("when something you've listed happens, advance the clock to that point") and prescriptive ("when you advance the clock otherwise, it causes the things you've listed"). If events overtake a clock, "just scribble it out" (fetched). — [The Daily Apocalypse](https://daily-apocalypse.com/daily-apocalypse/85-threat-countdown-clocks)

**Blades in the Dark (John Harper; SRD) [P]**
- Progress clocks track "ongoing effort against an obstacle or approaching trouble". "A complex obstacle is a 4-segment clock"; complicated is 6; daunting is 8 (fetched). — [Blades in the Dark SRD, Progress Clocks](https://bladesinthedark.com/progress-clocks)
- Clock types: danger clocks (filled by complications; when full "the danger comes to fruition"), racing clocks ("Create two opposed clocks to represent a race"), linked clocks, mission clocks (a deadline on an opportunity), tug-of-war clocks (which "can be filled *and* emptied by events"), long-term project clocks and faction clocks (fetched). — [Blades in the Dark SRD](https://bladesinthedark.com/progress-clocks)
- The game's GM actions are listed on an official playsheet as: "ask questions—provide opportunities—cut to the action—telegraph trouble—follow through—initiate action with an npc—tell them the consequences and ask—think off-screen" (search snippet). — [Evil Hat, Blades core playsheets](https://evilhat.com/wp-content/uploads/2022/05/blades_core_playsheets.pdf)
- The SRD's planning rule tells the GM to skip the approach and "cut to the action", to "the first serious obstacle in their path" (full text of the SRD markdown). — [Blades in the Dark SRD (GitHub)](https://raw.githubusercontent.com/amazingrando/blades-in-the-dark-srd-content/master/Blades-in-the-Dark-SRD.md)

**Justin Alexander, The Alexandrian [P]**
- "Don't Prep Plots" (23 March 2009): a plot is "the sequence of events in a story"; a situation is "merely a set of circumstances". A plotted adventure is "a chain of potential points of failure", and a broken link forces railroading. Instead, define the opposition's circumstances and aims ("What is the bad guy trying to do?"), give opponents goals, do not pre-plan contingencies ("you can just react"), and know your toolkit of people, places, equipment and information. Situation prep "empowers the players and makes their choices meaningful" (fetched). — [The Alexandrian, Don't Prep Plots](https://thealexandrian.net/wordpress/4147/roleplaying-games/dont-prep-plots)
- For any chokepoint problem, include three possible routes to success (fetched). — [The Alexandrian](https://thealexandrian.net/wordpress/4147/roleplaying-games/dont-prep-plots)
- "Three Clue Rule" (8 May 2008): "For any conclusion you want the PCs to make, include at least three clues", because players will miss one, ignore another and misread a third. Corollaries: permissive clue-finding ("more clues are always better"; reward clever approaches with information); proactive clues (when players stall, trigger an event that delivers new information, citing Raymond Chandler's "Have a guy with a gun walk through the door"); and red herrings are overrated, to be used "with *extreme* caution", since players invent false leads on their own (fetched). — [The Alexandrian, Three Clue Rule](https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule)

**"Yes, and", blocking and accepting [P]**
- Johnstone: "I call anything that an actor does an 'offer'. Each offer can either be accepted, or blocked." "A block is anything that prevents the action from developing, or that wipes out your partner's premise." "Blocking is a form of aggression" (fetched). — [Johnstone, *Impro*, Internet Archive](https://archive.org/stream/pdfy-KIkLrSPi_3lzPl5v/Keith%20Johnstone-Impro_%20Improvisation%20and%20the%20Theatre-Methuen%20Drama%20%281981%29_djvu.txt)

**Fail forward [P, weakly sourced]**
- Forum discussion treats "fail forward" as: a failed action still moves the story along, with "succeed at a cost" (as Fate phrases it) being one way to do that, not the whole idea. Fate is described as having graded outcomes paraphrased as failure, success at a cost, success and great success. Critics in the same thread warn the idea can be stretched until real failure disappears (search snippets of a forum thread; not an authoritative rules text). — [EN World, "Failing Forward"](https://www.enworld.org/threads/failing-forward.473785/)

### Inferences
- The Dungeon World move list is close to a ready-made menu for what the narrator's 2-5 sentences should do each turn. Mapped to a storybook: reveal an unwelcome truth, show signs of an approaching threat, use up a carried item, separate the hero from a companion, offer an opportunity with a cost, put a character in a spot, state the price and ask. An improvising narrator that picks one of these each turn will not meander.
- The soft-move / hard-move rule gives a fairness principle for consequences: trouble should be signalled one scene before it lands ("telegraph trouble"), and only land hard if the reader ignored or accepted the risk. This also makes the three choices informed, per section 1.
- "Tell them the requirements or consequences and ask" is, almost literally, the format of a DreamWeaver choice: "You can cross the river, but you'll lose the lantern."
- Open threads in the story bible are best written as fronts, not as topics: who or what wants something (impulse), what happens next if the hero does nothing (grim portent), and what the bad end state is (doom). A thread recorded only as "the missing key" gives the narrator nothing to advance; "the tide is rising toward the cave where the key is hidden" does.
- A clock per open thread (4 segments is the Blades default for a "complex" obstacle) gives the narrator an "offscreen" pacing tool: when the reader dawdles or picks a quiet scene, a clock ticks and the next scene shows a sign of it. Apocalypse World's stages give the tone: early ticks are preventable, late ticks are "brace for impact". Five open threads each with a clock is probably too many to tick at once; one main threat clock plus lighter threads is closer to the 2–3 dangers per front that Dungeon World recommends.
- "Play to find out what happens" and "Don't Prep Plots" both endorse DreamWeaver's no-plot design, with a condition: the narrator must establish a situation early (a goal, an opposing force with its own aim, a few resources and places) or there is nothing to play out.
- The Three Clue Rule applied to three choices: if the story needs the reader to learn or reach something, do not hang it on one option. At least one path to it should survive whichever option is chosen, and if the reader stalls, the narrator should bring the information to them (the proactive clue).
- Blocking, in Johnstone's sense, is what a narrator does when it ignores or nullifies a typed free-text action. The improv-derived ladder commonly taught as "yes, and / yes, but / no, but" follows from his accept/block distinction: accept the action and add a consequence, accept it at a cost, or refuse the literal action while offering something in its spirit. Flat "no" is the block.
- "Be a fan of the characters" sets the narrator's stance for a storybook audience: put the hero in trouble because it makes them interesting, not to punish the reader, and let them be good at what they have been shown to be good at.
- Handling derailment: for an improvised story there is no rail to leave, so "derailing" means the reader abandoning every open thread. The tabletop answers are (a) follow the reader, since the situation matters more than the plot, and (b) have the offscreen threat advance so the abandoned threads come to find the hero.
- "Spotlight" in tabletop means sharing attention between players; with a single reader, the nearest equivalent is rotating attention among companion characters so each recurs.

### Gaps
- I could not retrieve the Blades in the Dark GM goals, principles, best-practices and bad-habits pages (the URLs I tried returned 404, and that chapter is not in the SRD text). Phrases often attributed to it, such as "hold on lightly" or "be a fan of the PCs", are not verified here.
- The Apocalypse World rulebook was not read directly; its principles are cited through secondary commentary.
- "Yes, and", "yes, but" and "no, but" as named rungs, and "fail forward" as a term, have no single authoritative source that I found; they circulate as community vocabulary. The exact wording in 13th Age and the Fate SRD was not checked.
- I found nothing citable in this pass on pacing a single tabletop session by the clock, or on spotlight management, beyond the principles above.

---

## 5. Interactive fiction and narrative-design sources

### Takeaway
The interactive-fiction community's shared vocabulary (Ashwell's patterns, Short's storylets and qualities, Choice of Games' rules) converges on one design: small self-contained scenes, gated and coloured by a modest amount of visible state, with choices written so the reader can form an intention.

### Cited Findings
Most findings from these sources are filed under the question they answer. In summary:
- Sam Kabo Ashwell's eight structural patterns, 26 January 2015 — section 2. — [These Heterogenous Tasks](https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/)
- Emily Short on storylets (29 November 2019) and on quality-based, salience-based and waypoint structures (12 April 2016) — section 2. — [Storylets: You Want Them](https://emshort.blog/2019/11/29/storylets-you-want-them/); [Beyond Branching](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/)
- Short notes that Failbetter coined "quality-based narrative" and later stopped using the name (search snippet). — [Emily Short, QBN category](https://emshort.blog/category/quality-based-narrative/page/2/)
- Choice of Games: five rules for choices (2010), delayed branching and seven rules for stats (2011), intentional choices (2016) — sections 1, 2 and 8.
- Failbetter writer guidelines (2015) — sections 2 and 3. A further guideline sets a brevity limit: "root descriptions should not go longer than 30 words" (search snippet). — [Failbetter, Writer Guidelines Part III](https://www.failbettergames.com/news/fallen-london-writer-guidelines-part-iii)
- Short suggests prototyping by writing "storylet content and quality rules on a set of index cards" (fetched). — [Emily Short](https://emshort.blog/2019/11/29/storylets-you-want-them/)
- Inkle: *80 Days* contained about half a million words and around 450 journeys across 150 cities; Ingold: "Our strategy is to make sure we've created and included more content than any player can be bothered to play" (fetched). — [Game Developer](https://www.gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-)
- Inkle on why the map helped: every choice on a map-based adventure was "loaded with ready-made context" (search snippet). — [Game Developer, Road to the IGF: 80 Days](https://gamedeveloper.com/design/road-to-the-igf-inkle-s-i-80-days-i-)

### Inferences
- A DreamWeaver scene is effectively a storylet generated on demand: content (the 2-5 sentences), prerequisites (what the bible says is true), effects (what the scene changes in the bible). Asking the narrator to state, even privately, what each scene changes is the storylet discipline applied to generation.
- Failbetter's "two qualities" minimum suggests that a story tracking only one thing (progress toward the goal) will feel like a chain. Tracking a second axis that pulls against it (danger, a relationship, a dwindling resource) is what creates trade-offs.
- Short's caution about salience-selected endings applies to the "ask for an ending" button: an ending assembled from whatever happens to be salient may land flat. It should be composed deliberately from the open threads and the reader's most characteristic choices.
- The *80 Days* map point generalises: choices are easier to make informed when the fiction supplies ready context (a visible goal, a known deadline, known companions). Establishing those early lowers the explanatory burden on every later choice.

### Gaps
- The Choice of Games material here comes from their public blog posts; I did not locate a single consolidated "Game Design Guide" document in this pass, so "balanced stats" is represented by the 2011 stats article.
- I did not find the specific Emily Short posts on small-scale choice structures or on types of choice.
- Failbetter Part III and the Short remark about the name are from search snippets only.

---

## 6. Drama managers and experience managers (research)

### Takeaway
Research frames the core problem as balancing coherent story against user agency, and its standard answer is an unseen manager that looks ahead, scores possible continuations against an author's quality criteria (often a target tension curve) and nudges events. The reader keeps moment-to-moment freedom while the manager shapes the overall arc.

### Cited Findings

**Riedl and Bulitko, "Interactive Narrative: An Intelligent Systems Approach", *AI Magazine* 34(1), 2013 [R, survey]** — full text of the preprint read: [Georgia Tech preprint PDF](https://faculty.cc.gatech.edu/~riedl/pubs/aimag.pdf); journal page: [AI Magazine](https://ojs.aaai.org/index.php/aimagazine/article/view/2449)
- Definition: "Interactive narrative is a form of digital interactive experience in which users create or influence a dramatic storyline through their actions." The goal is that the user "believes that they are an integral part of an unfolding story and that their actions can significantly alter the direction and/or outcome of the story."
- "The core research challenge is how to balance the need for a coherent story progression with user agency, which are often at odds. A coherent narrative experience is one in which all events build off prior events until a conclusion is reached."
- Why users break stories: usually because the user "is unaware of the ways in which the narrative may unfold", but also because the user "is trying to steer the narrative in a new direction or actively and mischeviously testing the bounds of the system's responsiveness" [sic].
- "A drama manager is an intelligent, omniscient, and disembodied agent that monitors the virtual world and intervenes to drive the narrative forward according to some model of quality of experience." The idea is credited to Bates. An experience manager generalises it to non-dramatic aims such as education.
- The manager typically works through non-player characters, and "the user should not be aware of the existence of the experience manager or its interventions."
- It must "look ahead into possible futures"; the chosen continuation "does not have to be—and often should not be—the most likely sequence of events" but the best one by the author's criteria, which may include "principles of dramatic tension".
- Three dimensions for classifying systems: authorial intent, virtual character autonomy, and player modelling.
- On gamebooks: in a branching story graph "every possible narrative trajectory is manually authored", but content "can grow exponentially with the number of choice points".
- The "boundary problem": when the user does something that breaks the intended narrative, the manager can respond by intervention (prevent it, "e.g., by causing the user's gun to jam") or accommodation (allow it and regenerate the story to remove inconsistencies, "e.g., by selecting a new NPC to take the role of the killed character").
- Player modelling: the PaSSAGE system "guides the user down narrative branches that match the user's preferred style of play", by mapping observed behaviour to abstractions. The authors call this work "still in early stages".
- Using AI to take on creative responsibility "can yield greater responsiveness and range of narratives without diminishing player agency."
- Open questions listed include: "How and when to intervene in the virtual world on behalf of the user?", "How to encode human authorial intent and at what level of abstraction?" and "How to tailor narrative experiences?"

**Mateas and Stern, "Façade: An Experiment in Building a Fully-Realized Interactive Drama", Game Developers Conference 2003 [R, system description]** — full text read: [paper PDF](https://faculty.cc.gatech.edu/~isbell/classes/reading/papers/MateasSternGDC03.pdf)
- Aim: "20 minutes of emotionally intense, unified, dramatic action", varied enough that "only after playing it 6 or 7 times should the player begin to feel they have 'exhausted' its possibilities". "Change in the plot should not be traceable to distinct branch points."
- What narrative offers that pure simulation lacks: an experience that is "unified … with little or no extraneous action" and "efficient and well-paced", one that "stays interesting and never lags or gets boring". "These time-tested qualities of unity, efficiency and pacing are part of what makes good narratives so pleasurable."
- The metaphor: "open-ended sandbox-style play in which the system knows how to make sandcastles, and tries to collaborate with the player to do so."
- Structure: the story is a "bag of beats". A beat "is the smallest unit of dramatic action that moves a story forward" (after McKee), annotated "with preconditions and effects on the story state". Beats change "every minute or so", drawn from a pool of about 200; a full story is "about 18 beats in duration".
- Inside each beat: transition-in (characters express their intentions), body ("pose a dramatic question or situation to the player"), mix-ins ("react to the player before the beat completes"), wait for the player's reaction, and transition-out ("final reaction to the player's action (or inaction)").
- Pacing mechanism: beats are scored against an "Aristotelian story tension value arc"; "the available beat whose story tension effects most closely match the near-term trajectory of the ideal story tension arc" scores highest. The target slope is computed as (target tension − current tension) ÷ beats remaining.
- Two kinds of agency: "Player interaction alters the performance of a beat (local agency), and can have longer term effects on future beats (global agency)."
- Their proposed measures of local agency: how many distinct things the player can express at any moment; how many distinct immediate responses the system can give; and how often context changes so that repeating an action gives a different response.
- "The system never repeats a reaction (except for generic deflection reactions)"; a player sees "only about 25% of the total content in any one session".
- Story choice matters: the domestic-quarrel scenario was chosen "because it can be successfully broken apart into story beats that can be coherently resequenced in many different orders", unlike "a tightly-plotted drama such as Casablanca".
- A later paper describes the same family of managers as given "a desired curve of tension versus time", with each beat carrying the designer's estimate of how much tension it adds (search snippet). — [AIIDE paper on experience managers](https://ojs.aaai.org/index.php/AIIDE/article/download/18722/18499)

### Inferences
- DreamWeaver's narrator is both author and drama manager, and the survey's first requirement for a manager is that it "look ahead". A narrator that only continues the most likely next sentence is doing what Riedl and Bulitko warn against. The practical version is a short private planning step each turn: where is the story on its arc, what is the target tension for this point, which open thread should move.
- Façade's slope formula is directly usable. With a known or estimated story length, the narrator can be told the current scene number, a target tension for it, and asked to make the scene raise, hold or release tension accordingly. This needs a tension value in the story bible (Short's "menace" stat is the same idea).
- The beat anatomy matches a DreamWeaver turn: react to the last choice (transition-out of the previous beat), establish what the characters want now, pose a dramatic question, then stop and offer choices. The dramatic question is the piece most often missing from improvised narration.
- Accommodation over intervention. For free-text actions that would wreck the story (the hero throws away the quest item), the research gives two honest responses: prevent it in-fiction, or allow it and re-plan. An LLM can re-plan cheaply, so accommodation should be the default; in-fiction prevention ("the gun jams") is the equivalent of blocking and should be rare.
- Local agency is where DreamWeaver is naturally strong (any typed action gets a specific response). Global agency is where it is weak unless the bible is used: choices need "longer term effects on future beats".
- Façade's "never repeats a reaction" suggests a rule against repeating the same kind of scene or the same kind of choice set twice in a row.
- Façade's point about scenario choice implies that loose, situation-based premises (a place with secrets, a journey with stops, a group with tensions) suit improvised resequencing better than tightly plotted mysteries, which need facts to be fixed in advance.
- The survey's note that users sometimes test the system "mischievously" suggests a design stance for odd free-text input: treat it as play to be accommodated with consequences, not as an error.

### Gaps
- Both sources are system descriptions and a survey, not user studies. I did not retrieve evaluations showing that tension-curve management raises user satisfaction, nor the PaSSAGE evaluation results; the report should not claim these are proven effects.
- I did not review research on LLM-based drama management or AI Dungeon-style systems from 2020 onward; that literature exists but was outside what I could verify in this pass.
- The DiGRA 2005 Mateas and Stern paper, which develops the local/global agency distinction, was seen only as a search snippet.

---

## 7. Pacing over many turns

### Takeaway
Sources agree on the mechanisms (advance threats when nothing else is happening, cut to the action, vary intensity, follow a rising tension curve, end when the threads resolve) but give few numbers. The best length benchmarks I found are Façade's 20 minutes and about 18 beats, and the roughly six-page average path of a classic gamebook.

### Cited Findings
- Façade targets "20 minutes" with beats changing "every minute or so" and a full story "about 18 beats in duration" [R]. — [Mateas and Stern 2003](https://faculty.cc.gatech.edu/~isbell/classes/reading/papers/MateasSternGDC03.pdf)
- Mateas and Stern on why short and shaped beats long and loose: a well-formed experience "does not take an inordinate amount of time or labor", and "not everyone is willing to spend 40+ hours at the computer to get a complete experience" [R]. — [Mateas and Stern 2003](https://faculty.cc.gatech.edu/~isbell/classes/reading/papers/MateasSternGDC03.pdf)
- In a 110-page book from the most popular "choose a path" series, the average story runs about six pages; a Choice of Games playthrough involves "hundreds of individual decisions" [P]. — [Choice of Games, By the Numbers](https://www.choiceofgames.com/2011/07/by-the-numbers-how-to-write-a-long-interactive-novel-that-doesnt-suck/)
- Ashwell: heavily branching Time Cave works give short playthroughs that "strongly encourage replay"; Open Map structures risk becoming "slower-paced and less directed", with the player spending "less of their time advancing the story" [P]. — [Ashwell](https://heterogenoustasks.wordpress.com/2015/01/26/standard-patterns-in-choice-based-games/)
- Meier: too many heavy decisions in a row overwhelm; too few bore [P]. — [Game Developer](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- Dungeon World: make a move "when everyone looks to you to find out what happens"; "Show signs of an approaching threat"; "Think offscreen, too" [P]. — [Dungeon World SRD](https://www.dungeonworldsrd.com/gamemastering/)
- Apocalypse World clocks describe escalation in stages, from "coming, but preventable" to "inevitable, but there's still time to brace for impact" to "full, active expression" [P]. — [The Daily Apocalypse](https://daily-apocalypse.com/daily-apocalypse/85-threat-countdown-clocks)
- Alexander: when players stall, introduce an active event; "Have a guy with a gun walk through the door" [P]. — [The Alexandrian](https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule)
- Blades in the Dark: skip the approach and "cut to the action", starting at "the first serious obstacle" [P]. — [Blades SRD](https://raw.githubusercontent.com/amazingrando/blades-in-the-dark-srd-content/master/Blades-in-the-Dark-SRD.md)
- *80 Days*: the relationship between the two leads supplies material "between uneventful moments"; peril is kept "mild" [P]. — [Game Developer](https://www.gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-)
- Failbetter: hold rewards and pay them out together at the end of a strand; remind returning players where they are [P]. — [Failbetter, Writer Guidelines Part II](https://www.failbettergames.com/news/fallen-london-writer-guidelines-part-ii)
- Riedl and Bulitko: a coherent narrative is one where "all events build off prior events until a conclusion is reached" [R]. — [Riedl and Bulitko](https://faculty.cc.gatech.edu/~riedl/pubs/aimag.pdf)
- Johnstone: shape comes from reincorporating shelved material [P]. — [*Impro*](https://archive.org/stream/pdfy-KIkLrSPi_3lzPl5v/Keith%20Johnstone-Impro_%20Improvisation%20and%20the%20Theatre-Methuen%20Drama%20%281981%29_djvu.txt)

### Inferences
- Anti-meandering rule, from the Riedl and Bulitko coherence definition plus Johnstone: a scene that neither builds on a prior event nor moves an open thread is a candidate for cutting. Each scene should change at least one entry in the bible.
- Length benchmark: Façade's 18 beats at about a minute each is the closest designed analogue to a casual DreamWeaver session, and sits inside the app's 5-60 scene range. It suggests a default arc of roughly 15-20 scenes for a single sitting, with the narrator beginning to converge threads well before that. This is an analogy from one system, not a measured optimum.
- Since story length is not fixed in advance, the narrator needs a working estimate of "beats remaining" to pace against. Options: a soft default target (for example 15-20 scenes) that the narrator paces toward unless the reader keeps opening new directions; and treating the ending button as setting beats remaining to a small number (one to three scenes) so the ending is a short convergence rather than an abrupt stop.
- When to end: Johnstone and the fronts model point to the same signal. The story is ready to end when the main threat's clock has resolved one way or the other and the shelved elements have been reincorporated. A corollary for the bible: once the story is past its midpoint, stop adding open threads, and start closing them; five open threads late in a story is a sign of sprawl. The narrator could also steer toward the ending by itself offering a choice that leads to the climax once threads are converging.
- Scene variety: Meier's density warning and Façade's no-repeat rule support alternating scene types (action, discovery, quiet character moment, humour) and never running the same type three times in a row. The *80 Days* note suggests companion relationships are the natural content for quiet scenes.
- Escalation: the three clock stages give a simple three-act instruction for the main threat: early scenes show signs, middle scenes make it unavoidable, late scenes deliver it in full.
- If the reader's choices stall the story, the tabletop answer is an offscreen event arriving on-screen, tied to an existing thread rather than newly invented.

### Gaps
- I found no reliable data on how long casual interactive-story sessions actually run, on typical completion rates, or on the ideal number of scenes. The figures above are design targets from individual works. A statement such as "most sessions last N minutes" would be unsupported.
- No source in this pass prescribes a ratio of scene types (action to quiet and so on); the variety advice is inferred.
- I did not find practitioner guidance specific to children's or bedtime interactive stories, which may matter for DreamWeaver's audience.

---

## 8. Writing the choices themselves

### Takeaway
Options should be distinct in kind, roughly equal in appeal, and carry enough hint of risk and reward for the reader to choose on purpose. The specific rules with good sourcing are: no obviously best option, no opt-out option, no blind left-or-right, signal stakes in or before the option text, and tempt the reader with at least one riskier path. Guidance on the exact number of options and on grammar is thin.

### Cited Findings
- No option should be obviously better or worse than the rest; fix weak options by improving them rather than hiding information. — [Choice of Games, 5 Rules](https://www.choiceofgames.com/2010/03/5-rules-for-writing-interesting-choices-in-multiple-choice-games/)
- Avoid "opt-out" options such as staying home instead of going on the adventure. — [Choice of Games, 5 Rules](https://www.choiceofgames.com/2010/03/5-rules-for-writing-interesting-choices-in-multiple-choice-games/)
- Every option, including the "wrong" one, should lead somewhere entertaining: "Wow, that was neat!" not "Oops. That was lame." — [Choice of Games, 5 Rules](https://www.choiceofgames.com/2010/03/5-rules-for-writing-interesting-choices-in-multiple-choice-games/)
- Bare "Go right" / "Go left" options force random picks. Signal the likely story result, what is being tested and the relative difficulty, in the lead-up narration or in the option text. One worked example bolds the trade-off inside each option. — [Choice of Games, Intentional Choices](https://www.choiceofgames.com/2016/12/how-to-write-intentional-choices/)
- Do not make every choice "which skill do I use?"; mix in personality choices and moral dilemmas with no right answer, and resource-spending choices. — [Choice of Games, 7 Rules](https://www.choiceofgames.com/2011/07/7-rules-for-designing-great-stats/)
- Present "several equally appealing alternatives", using opposed values to keep them balanced. — [Choice of Games, 7 Rules](https://www.choiceofgames.com/2011/07/7-rules-for-designing-great-stats/)
- A choice the player always answers the same way, or answers at random, is not interesting; good options are situational, involve risk versus reward or short term versus long term, or let the player express a style. — [Game Developer on Meier](https://gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- "Tell them the requirements or consequences and ask"; "Offer an opportunity, with or without cost." — [Dungeon World SRD](https://www.dungeonworldsrd.com/gamemastering/)
- "Tempt players into making bad decisions"; the unexpected adventures are the memorable ones. — [MCV/Develop on Meg Jayanth](https://mcvuk.com/development-news/80-days-writer-tempt-your-players-into-making-bad-decisions/)
- Consequences should be ones the player can anticipate and plan around. — [Game Developer on 80 Days](https://www.gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-)
- Ingold dislikes interfaces that expose the numbers behind a choice: "I might as well be the game designer". The article notes that other designers (for example *Tavern Crawler*) do show them, so this is a live disagreement. — [Game Developer](https://gamedeveloper.com/design/should-games-have-meaningful-choices-)
- Brevity: Fallen London caps root descriptions at 30 words (search snippet). — [Failbetter, Writer Guidelines Part III](https://www.failbettergames.com/news/fallen-london-writer-guidelines-part-iii)
- On the number three: a third-party digest of Ingold's AdventureX 2018 talk attributes to him the view that three options beat two (which feels binary) and four (which can overwhelm), and describes "sanity logic" (hiding options that make no sense in context) and "trapdoor" choices that skip a conversation ahead. I could not verify this against the talk itself; treat as unconfirmed. — [Recapio digest](https://recapio.com/digest/advx-2018-jon-ingold-sparkling-dialogue-a-masterclass-by-adventurex)
- For comparison, classic gamebooks are modelled by Fabulich as two options per page. — [Choice of Games, By the Numbers](https://www.choiceofgames.com/2011/07/by-the-numbers-how-to-write-a-long-interactive-novel-that-doesnt-suck/)

### Inferences
Candidate rules for DreamWeaver's three options, each traceable to the findings above:

1. **Three different kinds of move, not three flavours of one.** Vary along at least one real axis: approach (bold / careful / clever), value (kindness / curiosity / loyalty), or time horizon (deal with it now / prepare for later). This is the Choice of Games advice against repeating "which skill" choices, plus Meier's decision types.
2. **Each option names an action and hints at its stake.** "Cross the rope bridge before the storm hits" tells the reader more than "Go across". Where there is a cost, say it ("…and leave the lantern behind"). This is Slitt's intentionality and Dungeon World's "tell them the consequences and ask".
3. **No free lunch and no trap.** If one option is clearly safest and best, strengthen the others or attach a cost to it. If one is clearly foolish, give it an upside (Fabulich Rule 3; Jayanth).
4. **No opt-outs.** "Go home", "do nothing" and "wait and see" are weak unless waiting has a visible price, such as a clock advancing (Fabulich; Blades clocks).
5. **No blind doors.** Never offer directions or objects with nothing to distinguish them (Slitt).
6. **One option should reveal character.** A choice about how the hero treats someone, or what they value, with no right answer (Choice of Games personality and morality traits; Meier's "personal").
7. **One option may be the tempting or surprising one**, riskier or stranger than the others, and it must lead somewhere good for the story if taken (Jayanth; Fabulich's "that was neat").
8. **At least one option should touch the bible**: use a carried item, call on a known character, or act on an open thread. This is the callback rule from section 3 applied at the level of the choice list, and it keeps Meier's "situational" quality.
9. **Keep them short and comparable.** Failbetter's 30-word cap on root text suggests options well under that; a single line each. Writing all three in the same grammatical shape (a verb phrase starting with an action) makes them easy to compare.
10. **Vary the choice type across turns.** Not every turn should be a dilemma; Meier warns against a run of heavy decisions. Alternate weighty choices with light expressive ones.
11. **The following scene opens by honouring the choice** (Meier on feedback), and occasionally a later scene does too (delayed branching).

Further inferences:
- Signalling tone and risk through wording, rather than through icons or numbers, is consistent with Ingold's preference for keeping the machinery hidden, and suits a storybook. The opposing view (show the stat effects) is held by Choice of Games, whose games display a stat screen; this is a design choice, not a settled question.
- The free-text box changes the job of the three suggestions. They need not cover every possibility; they should model interesting moves and show what kind of story this is. That favours distinct, characterful suggestions over an attempt at exhaustive coverage.
- Since the same narrator writes both the scene and the choices, the scene should end on a dramatic question (the Façade beat body) that the three options answer differently. A scene that ends on a resolved note produces "what next?" choices, which drift toward blind doors.

### Gaps
- I found no well-sourced rule on the ideal number of options. The one claim favouring three is from an unverified digest of a talk. DreamWeaver's three is consistent with it but not thereby validated.
- I found no source on parallel grammar or sentence form for options; rule 9's grammar point is my inference from general clarity practice, not a cited finding.
- I found no research evidence on whether readers prefer signalled or unsignalled risk in story choices, or on how often a "wild card" option is chosen.
- None of the sources address choice-writing for young readers specifically.
