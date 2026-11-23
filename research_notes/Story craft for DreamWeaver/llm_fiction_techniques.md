# Getting LLMs to write better fiction (long-form and interactive), state of knowledge as of 2026-11-23

Reader notes on how these notes were made:

- Research date 2026-11-23. Most findings below were confirmed through search-result summaries or abstracts, not full-paper reads. Where I only saw an abstract or a secondary summary I say so.
- "Measured" means a study reported a number. "Practitioner" means product documentation, press, or a blog. "Inference" sections are my own reasoning and are not sourced.
- Many controlled studies used GPT-3/GPT-4/Claude 3-era models. I flag those; their absolute numbers should not be assumed for gpt-6-luna or other late-2026 models. The qualitative failure modes are still reported in 2026 studies (see the first section).
- Items marked "(not re-fetched)" are papers I know from background knowledge whose URLs and details I did not re-verify in this session; treat their details as lower confidence.

## 1. Documented weaknesses of LLM fiction

### Takeaway
The best-evidenced weaknesses are sameness (across stories, plots, names and phrases), arcs that are too happy with too few setbacks and early or weak turning points, and cliché-heavy over-explained prose. 2026 studies still find the sameness problem in frontier models, and find that simple fixes (negative prompting, temperature) do not remove it.

### Cited Findings

Creativity and craft versus professionals (older models):
- Measured: Chakrabarty et al. (CHI 2024) built the Torrance Test of Creative Writing (TTCW), 14 binary tests across fluency, flexibility, originality and elaboration, validated on 48 stories with 10 creative-writing experts. LLM stories passed 3-10x fewer TTCW tests than stories by professionals. Models were 2023-era (GPT-3.5/GPT-4/Claude 1.x generation). — [arXiv 2309.14556](https://arxiv.org/abs/2309.14556v3), [data and code](https://github.com/salesforce/creativity_eval)
- Measured: in the same paper no LLM used as an automatic assessor correlated positively with the expert assessments. — [arXiv 2309.14556](https://arxiv.org/abs/2309.14556v3)

Prose-level tics:
- Measured/qualitative: Chakrabarty, Laban and Wu ("Can AI Writing be Salvaged?", CHI 2025) interviewed professional writers and derived a seven-category taxonomy of LLM prose idiosyncrasies; categories include clichés, unnecessary exposition, purple prose and poor sentence structure. Expert edits reduced these and edited text was preferred. I saw snippets only. — [arXiv 2409.14509](https://arxiv.org/abs/2409.14509)
- Measured: Paech et al. (Antislop, ICLR 2026) generated about 2,000 creative-writing outputs per model and compared against human baselines. Some patterns appear over 1,000x more often than in human text; the name "Elara" appeared 85,513x more often in gemma-3-12b's creative writing than in human text; the trigram "heart hammered ribs" was 1,192x over-represented. Tested on open-weight models. — [arXiv 2510.15061](https://arxiv.org/abs/2510.15061)
- Vendor acknowledgement: OpenAI's GPT-6 Astra documentation says the model "may use recurring phrases across sessions" (as reported by a search summary of the model page), and OpenAI's GPT-6 Astra prompting tips include a blocklist of slop phrases such as "delve into", "it's worth noting", "X, not Y" contrasts, "really/truly", summary closers and made-up hyphenated compounds. — [The Decoder, 2026-09-05](https://the-decoder.com/openai-shares-prompting-tips-for-gpt-6-astra-including-a-blocklist-of-slop-words/)

Sameness and low diversity:
- Measured: Doshi and Hauser (Science Advances, 2024): roughly 300 non-professional writers, about 600 evaluators. Access to GenAI story ideas made stories rated more creative, better written and more enjoyable, especially for less creative writers, but the AI-assisted stories were more similar to each other than human-only stories. GPT-4-era. — [PMC full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC11244532), [NPR coverage](https://www.npr.org/2024/07/12/nx-s1-5033988/research-ai-chatbots-creativity-writing)
- Measured: Xu et al. (Microsoft, "Echoes in AI", PNAS 2025) introduced the Sui Generis score (how unlikely a plot element is to recur in alternative continuations by the same model). Across 100 short stories, GPT-4 and LLaMA-3 stories contained plot elements echoed across generations and across different LLMs; human plots were rarely recreated. The score correlated moderately with human surprise ratings. — [arXiv 2501.00273](https://arxiv.org/html/2501.00273v2)
- Measured, current: Thennal DK and Hatzel ("Do Large Language Models Always Tell The Same Stories?", June 2026, revised Sept 2026) tested 10 LLMs on r/WritingPrompts prompts. LLM narratives were consistently more similar to each other than human stories; frontier models "converge on a 'mean' generic narrative"; negative prompting and temperature scaling "fail to meaningfully address" this. Abstract only; the model list and effect sizes were not visible. — [arXiv 2606.17350](https://arxiv.org/abs/2606.17350)

Plot shape, conflict avoidance and happy endings:
- Measured: Tian et al. (EMNLP 2024, "Are Large Language Models Capable of Generating Human-Level Narratives?") analysed story arcs, turning points and affect. LLM stories had homogeneously happier, less complex arcs, avoided negative plot progressions, placed turning points earlier than human writers, included fewer setbacks, and were weaker on the major setback and climax, which reduced suspense and arousal. GPT-4-era. — [arXiv 2407.13248](https://arxiv.org/abs/2407.13248v2), [ACL Anthology](https://aclanthology.org/2024.emnlp-main.978)
- Measured: Yi et al. ("Too Good to be Bad", Findings of ACL 2026) found role-play fidelity falls monotonically as character morality decreases: average fidelity 3.21 for moral paragons versus 2.61 for villains, with the steepest drop between flawed-but-good and self-serving characters. The authors attribute it to safety alignment; highly safety-aligned models were most affected. — [arXiv 2511.04962](https://arxiv.org/abs/2511.04962v1)
- Lower confidence: a search summary cited a preliminary 2026 study reporting sycophancy at 91.7% prevalence in creative-writing interactions. I could not confirm which paper this is; the candidate link is [arXiv 2604.04735](https://arxiv.org/html/2604.04735v1). Treat as unverified.

Long-range coherence:
- Measured/qualitative, current: AutoFiction (Pham, Chang and Iyyer, ICML 2026 workshop) hosts 41 AI-generated novels made with coding-agent harnesses (outline, parallel chapter drafts, chapter and full-book review, cross-chapter audit, repeated revision). Human feedback: interesting descriptions and concepts, but frequent failures in long-range coherence and prose quality, "including conceptual repetition, distracting details, and weak dialogues". This is with frontier agents and heavy scaffolding. — [AutoFiction paper](https://genaicreativity.org/icml2026/files/22/22_paper.pdf)
- Practitioner/anecdote: CALYPSO interviewees (AIIDE 2023) noted that players who had used AI Dungeon were already familiar with AI's weakness in long-context storytelling. Not a measurement. — [arXiv 2308.07540](https://arxiv.org/abs/2308.07540v1)
- Anecdote: a November 2026 OpenAI developer-forum thread alleges ChatGPT's long-form fiction regressed (character autonomy, emotional depth) at medium thinking effort. Single user, uncontrolled. — [OpenAI community thread](https://community.openai.com/t/has-chatgpts-long-form-fiction-writing-regressed-character-autonomy-source-fidelity-emotional-depth-and-narrative-quality-june-november-2026/1412576)

### Inferences
- DreamWeaver's design (no arc, improvised turn by turn, three offered choices, small model) is exposed to exactly the measured failure pattern: too few setbacks, early resolution, happy flat arcs. Tian et al.'s finding that turning points come too early and setbacks are scarce maps directly onto "the narrator resolves the problem within a turn or two".
- Sameness matters more for an app than for a single story: a returning reader sees many stories from the same model and will notice the recurring names, creatures and plot beats that a one-off reader would not.
- The villain-fidelity result suggests the model will soften antagonists unless the prompt explicitly licenses real opposition; for an all-ages product the softening is partly desirable, so the target is "real obstacles and setbacks", not "darker characters".

### Gaps
- I found no study that measures "rushing to a tidy moralising ending" as a named variable; the closest evidence is Tian et al. (happier arcs, fewer setbacks, early turning points).
- No controlled measurement of "telling rather than showing" or "flat characters" beyond the expert taxonomy in Chakrabarty et al. 2025 and TTCW test failures.
- No study found on these weaknesses specifically for gpt-6-luna or other small late-2026 models.

## 2. Planning and structure techniques

### Takeaway
Planning ahead is the most consistently supported intervention in the literature: outline-first systems beat direct generation on coherence and interestingness in human evaluations, and giving the model explicit arc and turning-point information measurably raised diversity and suspense. Most evidence is from older models and multi-call pipelines, so the transferable part for a one-call-per-turn product is the idea (a planned arc and scheduled setbacks held in state), not the full pipelines.

### Cited Findings
- Measured: Re3 (Yang, Tian, Peng, Klein; EMNLP 2022) plans a structured outline, drafts recursively, reranks candidate continuations for coherence and premise relevance, then edits for factual consistency. Versus same-model direct generation, human evaluators judged 14% (absolute) more Re3 stories to have a coherent overarching plot, and more to be relevant to the premise. GPT-3-era; many calls per passage. — [arXiv 2210.06774](https://arxiv.org/abs/2210.06774v2), [ACL Anthology](https://aclanthology.org/2022.emnlp-main.296)
- Measured: DOC (Yang, Klein, Peng, Tian; ACL 2023) adds a detailed hierarchical outliner and a controller that keeps passages aligned with the outline. Over Re3, human evaluation gains were 22.5% absolute on plot coherence, 28.2% on outline relevance and 20.7% on interestingness. The design moves "creative burden from the main drafting procedure to the planning stage". Older open/GPT-3-era models. — [ACL Anthology](https://aclanthology.org/2023.acl-long.190), [arXiv 2212.10077](https://arxiv.org/pdf/2212.10077)
- Measured: Tian et al. (EMNLP 2024): prompting with story-arc information improved diversity by about 45% over vanilla prompting; adding turning-point information improved suspense and engagement by about 40% (figures from the abstract as summarised). GPT-4-era. — [arXiv 2407.13248](https://arxiv.org/abs/2407.13248v2)
- Measured: Agents' Room (Huot et al., Google DeepMind, ICLR 2025) decomposes writing into planning agents (conflict, character, setting, plot, drawing on narrative theory) and writing agents, coordinated by an orchestrator with a shared scratchpad. Human raters preferred its stories over end-to-end baselines; fine-tuned agents beat zero-shot ones. Dataset: Tell Me A Story, about 350 expert stories of about 2k words. Gemini 1.5-era. — [arXiv 2410.02603](https://arxiv.org/abs/2410.02603v2), [ICLR proceedings](https://proceedings.iclr.cc/paper_files/paper/2025/hash/0fbc8a83d93dd8021a4dd8d2d34138eb-Abstract-Conference.html)
- Dramatron (Mirowski et al., Google DeepMind, CHI 2023) used hierarchical prompt chaining (logline, then characters, plot beats and locations, then dialogue) for scripts and was evaluated with 15 theatre and film professionals, who valued the structure but criticised formulaic output. (not re-fetched) — [arXiv 2209.14958](https://arxiv.org/abs/2209.14958)
- RecurrentGPT (Zhou et al., 2023) simulates an LSTM in natural language: each step writes a paragraph plus a short plan for the next paragraph, and updates a short-term summary and a long-term memory retrieved by similarity. (not re-fetched) — [arXiv 2305.13304](https://arxiv.org/abs/2305.13304)
- Interactive-specific, qualitative: Dramamancer (I3D 2026) frames the LLM as a drama manager steered by author-written storylets and context engineering, and states that LLM interactive-story systems "struggle with pacing, structure, and narrative progression". — [Dramamancer paper](https://mkremins.github.io/publications/Dramamancer_I3D2026.pdf), [design-techniques companion, arXiv 2601.18785](https://arxiv.org/html/2601.18785)
- Interactive-specific: SNAP (arXiv 2601.11529) divides a narrative into "Cells" with explicit plans to stop narrative drift; Auto-Drama / "From Role-Play to Drama-Interaction" (arXiv 2405.14231) splits a plot into consecutive narrative-chain segments so the player can influence events while the plot still progresses; WhatELSE (CHI 2025) combines symbolic planning, LLMs and character simulation. I did not see evaluation numbers for any of these. — [SNAP](https://arxiv.org/pdf/2601.11529v1), [Auto-Drama](https://arxiv.org/pdf/2405.14231), [WhatELSE](https://arxiv.org/pdf/2502.18641), [Wu et al. immersion and agency](https://arxiv.org/html/2502.17878v1)
- Practitioner: Hidden Door describes its engine as built on pre-computed tropes and "story thread templates", with many small AI tasks combined with structured narrative beats and a database of tropes and world rules; the CEO frames creativity as coming from authors, not the machine. Company account relayed by press. — [Yahoo/Engadget-syndicated article](https://ca.news.yahoo.com/how-do-you-prevent-an-ai-generated-game-from-losing-the-plot-170002788.html), [AI Gamechangers interview](https://aigamechangers.substack.com/p/the-machine-is-not-itself-creative)
- Even heavy planning does not solve long-form quality: AutoFiction's structured harness (outline, drafting, multi-level review, audit, revision) with frontier coding agents still produced novels that readers found weak in long-range coherence and prose. — [AutoFiction paper](https://genaicreativity.org/icml2026/files/22/22_paper.pdf)

### Inferences
- For DreamWeaver the cheapest version of "planning" is one extra call at story start (or folded into turn 1) that writes a hidden arc: the protagonist's want, the central obstacle, two or three planned complications or reversals, a secret or twist, and a rough turn budget. That plan then travels in the story bible. Cost is one small call per story, not per turn.
- A per-turn "beat" or "act" field in the bible (for example: setup, rising trouble, major setback, climax, resolution, with a turn counter) would let the system prompt tell the narrator which phase it is in and forbid resolution before the climax phase. This targets the measured early-turning-point and too-few-setbacks failures directly and adds only a few tokens.
- Because readers choose, the plan must be a loose set of pending complications rather than a fixed outline; the storylet and narrative-chain work points the same way (pre-authored or pre-planned beats that are triggered when they fit).
- The "end the story" button needs a plan-aware ending: the ending call should be told which threads are open and asked to pay off the planted secret, rather than wrap up generically.

### Gaps
- No controlled study found of planning in a one-call-per-turn, reader-driven setting with a small 2026 model. The gains above come from multi-call pipelines on older models.
- StoryVerse (2024, author-defined "abstract acts" with LLM character simulation) was requested but I did not retrieve or verify it this session.
- I did not find evaluation numbers for Dramamancer, SNAP or WhatELSE.

## 3. Memory and coherence over long interactions

### Takeaway
Shipping interactive-fiction products converge on the same layered memory: always-in-context essentials, a rolling auto-summary built from chunks of recent turns, keyword- or retrieval-triggered entity cards, and recent history verbatim. DreamWeaver's story bible plus last-eight-scenes is already this pattern in miniature; at 5-60 turns the likelier weak points are a 120-word summary that loses planted details and the absence of any forward-looking state, not missing retrieval.

### Cited Findings
- Practitioner (Latitude, AI Dungeon help docs): three components. Plot Essentials are always in context. Story Summary is built by auto-summarisation from Memories; each Memory is generated from four earlier actions and their AI responses, Memories are appended to the summary, and the summary is re-summarised when long. Users can edit the summary to fix errors. — [The Memory System](https://help.aidungeon.com/faq/the-memory-system), [Plot Essentials](https://help.aidungeon.com/faq/plot-essentials)
- Practitioner (Latitude): Story Cards are long-term memory that is not always in context; a card loads only when its trigger keywords appear in recent text, prioritised by recency and frequency of trigger use, limited by remaining token space. A Memory Bank stores Memories and retrieves relevant ones. — [Story Cards](https://help.aidungeon.io/faq/story-cards), [What goes into the context](https://help.aidungeon.com/faq/what-goes-into-the-context-sent-to-the-ai)
- Practitioner (Latitude): after required elements, remaining context is split roughly one quarter to matching Story Cards, one half to recent History and one quarter to the Memory Bank. The percentages may have changed since the page was written. — [What goes into the context](https://help.aidungeon.com/faq/what-goes-into-the-context-sent-to-the-ai)
- Practitioner (Hidden Door, via press): player inputs are mapped onto a game state held in a database of characters, locations, items and relationships; inputs outside the system's vocabulary are rejected. — [Yahoo-syndicated article](https://ca.news.yahoo.com/how-do-you-prevent-an-ai-generated-game-from-losing-the-plot-170002788.html); independent critique in [Ian Bicking's design review, Aug 2025](https://ianbicking.org/blog/2025/08/hidden-door-design-review-llm-driven-game)
- Measured/qualitative: CALYPSO (Zhu, Martin, Head, Callison-Burch; AIIDE 2023) tested three LLM interfaces with 71 players and DMs. The assistant was found useful more often than not; the main failure was invented facts that contradict source material; the paper keeps the human DM as final decision-maker. GPT-3/ChatGPT-era. — [AAAI/AIIDE](https://ojs.aaai.org/index.php/AIIDE/article/view/27534), [arXiv 2308.07540](https://arxiv.org/abs/2308.07540v1)
- Research systems: Re3's edit step checks drafts for factual consistency against tracked story facts; RecurrentGPT keeps a short-term summary plus retrievable long-term memory (not re-fetched). — [Re3](https://arxiv.org/abs/2210.06774v2), [RecurrentGPT](https://arxiv.org/abs/2305.13304)
- Context is no longer the binding constraint: gpt-6-luna has a 1,050,000-token context window, and cached input is billed at 10% of the input rate ($0.01 versus $0.10 per million tokens). — [OpenAI model page](https://developers.openai.com/api/docs/models/gpt-6-luna.md)
- Vendor guidance on long context (Anthropic): place long documents and inputs near the top of the prompt, above the query and instructions. — [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

### Inferences
- At 2-5 sentences a scene, a 60-turn story is only a few thousand tokens. Sending the whole story verbatim every turn is affordable on Luna (roughly 60 turns x about 120 tokens of narration = about 7k tokens, which is about $0.0007 uncached per call at $0.10/M) and removes most forgetting risk. Token count here is my estimate, not a measured figure.
- If the full transcript is sent, the bible's job changes from "memory" to "attention and intent": fixed appearance text for image consistency, open threads, and the forward plan. The 120-word cap on the summary could then be relaxed or the summary repurposed.
- Useful state the current bible lacks, judged against the research systems: unresolved promises or planted details ("Chekhov's guns"), each character's want and attitude toward the protagonist, the current stakes, and a turn or phase counter. These are the items planning systems track and that a rolling summary tends to drop.
- A stable prefix (system prompt, then full story so far, then the volatile bible and instruction last) fits prompt caching, since each turn extends the previous prompt. Whether the bible should sit before or after the transcript is a trade-off between caching and Anthropic-style "data first" ordering.

### Gaps
- No controlled comparison found of summary-plus-window versus full-history for short interactive stories on current models.
- No measured data on how often small 2026 models contradict a structured story bible.
- No primary NovelAI engineering write-up was retrieved; I did not search for it specifically.

## 4. Critique-and-revise, candidate selection, and injected randomness

### Takeaway
Reranking and editing passes have supporting evidence in older pipelines, and human expert edits clearly help, but LLM self-critique is weakly evidenced for fiction and LLM judges agree with human story preferences only about 73% of the time, so a "critic" can select for the wrong thing. For diversity, the supported levers are structural (varied personas, arc types, sampling from an explicitly enumerated distribution); banning words and raising temperature are reported not to fix plot-level sameness.

### Cited Findings
- Measured: Re3's revision stage reranks alternative continuations for coherence and premise relevance and edits the winner for factual consistency; the whole system gave a 14% absolute gain in plot-coherence judgments, with no separate figure for the rerank step in what I saw. — [arXiv 2210.06774](https://arxiv.org/abs/2210.06774v2)
- Measured: expert human edits of LLM prose reduce clichés, lack of detail and awkward constructions and are preferred by creative-writing experts; the authors also tested LLM self-detection and rewriting of these idiosyncrasies, and note expert editing does not scale. I did not see the self-rewrite numbers. — [arXiv 2409.14509](https://arxiv.org/abs/2409.14509), summary of it in [ACL 2026 paper](https://aclanthology.org/2026.acl-long.2030.pdf)
- Measured: R2-Write (Liu et al., April 2026) reports that mainstream reasoning models show "limited gains" on open-ended writing and lack the reflection-and-revision patterns they use in maths; its fix is training-time (synthesised writer-judge trajectories plus a process reward), not a prompting trick. Abstract only, no numbers seen. — [arXiv 2604.03004](https://arxiv.org/abs/2604.03004)
- Measured: LitBench (Fein et al., EACL 2026): best off-the-shelf zero-shot judge (Claude 3.7 Sonnet) agreed with human story preferences 73% of the time; small and open-source judges did worse; trained reward models reached 78%. A selection step that uses an LLM judge inherits this ceiling. — [ACL Anthology](https://aclanthology.org/2026.eacl-long.362)
- Measured: Verbalized Sampling (Zhang et al., ICML 2026): ask the model for several candidate responses with probabilities, then sample from that set. Reported 1.6-2.1x diversity over direct prompting in creative writing and a 25.7% improvement in human evaluation scores; more capable models benefit more. Author-reported; I found no independent replication. — [arXiv 2510.01171](https://arxiv.org/abs/2510.01171v3), [code](https://github.com/CHATS-lab/verbalized-sampling)
- Measured: a 2025 follow-up to Doshi and Hauser (Wan and Kalman, per a search summary) prompted the model with ten diverse personas instead of one generic prompt and found the collective diversity loss disappeared. The arXiv ID is my best match and was not confirmed. — [arXiv 2502.17962](https://www.arxiv.org/pdf/2502.17962)
- Measured: story-arc conditioning raised diversity by about 45% (Tian et al.). — [arXiv 2407.13248](https://arxiv.org/abs/2407.13248v2)
- Measured, negative: negative prompting and temperature scaling "fail to meaningfully address" narrative homogeneity across 10 LLMs. — [arXiv 2606.17350](https://arxiv.org/abs/2606.17350)
- Measured: phrase-level slop can be suppressed at decode time: the Antislop sampler backtracks and resamples when a banned pattern appears and handled 8,000+ patterns while maintaining quality, whereas plain token banning became unusable at about 2,000 patterns; a fine-tuning method (FTPO) cut slop about 90%. These need logit access or fine-tuning, so they are not available on a hosted OpenAI model with strict structured output. — [arXiv 2510.15061](https://arxiv.org/abs/2510.15061), [repo](https://github.com/sam-paech/antislop-sampler)
- Measured: fine-tuning beats prompting for prose quality. Chakrabarty and Dhillon (CHI 2026): with in-context prompting, 28 expert judges preferred human writing in 82.7% of comparisons; after fine-tuning on authors' complete works, experts preferred the AI text 62% of the time. Lay judges (131) preferred AI writing in both conditions. Median fine-tuning cost was $81 per author in the earlier preprint. — [arXiv 2601.18353](https://arxiv.org/abs/2601.18353), [arXiv 2510.13939](https://arxiv.org/abs/2510.13939v4)
- Multi-agent: Agents' Room's specialised planning-plus-writing agents beat end-to-end generation in human evaluation; cost is several calls per story section. — [arXiv 2410.02603](https://arxiv.org/abs/2410.02603v2)

### Inferences
- Per-turn self-critique or candidate reranking would at least double DreamWeaver's per-turn text cost and latency, for an uncertain gain on a 2-5 sentence output. On current pricing the text cost is tiny in absolute terms (see section 6), so latency, not money, is the real cost of a second pass.
- The cheapest robust diversity lever is randomness injected by code, not by the model: at story start, have the application pick from curated lists (arc type, tone, a complication type, an unusual setting detail, a name drawn from a large name list) and pass them in. This matches the persona and arc-conditioning findings (vary the conditioning, not the temperature) and costs nothing per turn.
- A code-side stock-name and phrase check is a cheap partial substitute for the Antislop sampler: reject or replace names like "Elara" at character creation, and keep a short list of the model's own observed tics in the prompt. Per the 2026 homogeneity study, expect this to fix surface repetition but not plot sameness.
- The lay-versus-expert split in Chakrabarty and Dhillon suggests DreamWeaver's audience (general readers, children and parents) is less sensitive to "AI prose" than experts are; plot shape and surprise are probably a better use of effort than polishing sentences.
- Verbalized-sampling can be folded into the existing single call for the three choices: ask for more than three candidate choices including an unlikely one, then keep three in code. This is an untested adaptation.

### Gaps
- No study found that isolates the value of an LLM self-critique pass for short fiction on 2026 models with cost and latency reported.
- No direct evidence on "oblique strategy" style random prompts for fiction; the persona and arc results are the nearest.
- The Wan and Kalman replication details (models, sample) were not verified.

## 5. Prompting for style, and what the vendors say

### Takeaway
Vendor guidance for current models favours positive instructions with reasons, a small set of varied examples, matching the prompt's own style to the desired output, and a short explicit list of phrases to avoid; neither vendor publishes fiction-specific guidance that I could find. Research adds that the content of the conditioning (arc, turning points, personas) moves story quality more than stylistic exhortation does.

### Cited Findings
- Anthropic (current page covers Claude Fable 5.2 back to Haiku 4.5): examples "are one of the most reliable ways to steer" output format, tone and structure; include 3-5, make them diverse and relevant, and wrap them in example tags. — [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- Anthropic: "Tell Claude what to do instead of what not to do" for format control; explain the motivation behind an instruction so the model can generalise; the formatting style of the prompt influences the style of the response; setting a role in the system prompt focuses behaviour and tone, "even a single sentence makes a difference". — [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- Anthropic: thinking "adds latency and should only be used when it will meaningfully improve" results; effort is the control for thinking depth on current models. — [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- OpenAI (GPT-6 Astra tips, Sept 2026): a blocklist of slop phrases and constructions is part of official guidance (see section 1); also short paragraphs with one idea each, plain language, active voice. This guidance is written for general and technical writing, not fiction. — [The Decoder](https://the-decoder.com/openai-shares-prompting-tips-for-gpt-6-astra-including-a-blocklist-of-slop-words/)
- OpenAI (latest-model guide, currently for GPT-6.2 Astra and Sol): start new integrations at medium reasoning effort; if using none or minimal, move to low; the model is more concise by default, so revisit old "be concise" instructions; the guide does not cover creative writing, structured outputs or the small Luna tier. — [OpenAI latest-model guide](https://developers.openai.com/api/docs/guides/latest-model)
- Secondary: the GPT-5.6 guidance was summarised in press as "stop over-prompting", with old "be brief" lines over-correcting into answers that are too short. — [Decrypt](https://decrypt.co/373439/openai-new-gpt-5-6-prompt-guide-chatgpt)
- Research: explicit arc and turning-point information in the prompt gave about 45% more diversity and about 40% more suspense and engagement (GPT-4-era). — [arXiv 2407.13248](https://arxiv.org/abs/2407.13248v2)
- Research: in-context style imitation (instructions plus examples) left expert readers preferring human text 82.7% of the time, with cliché density cited as a mediator; prompting alone did not remove detectable AI quirks. — [arXiv 2601.18353](https://arxiv.org/abs/2601.18353), [arXiv 2510.13939](https://arxiv.org/abs/2510.13939v4)
- Research: negative prompting did not fix plot-level homogeneity. — [arXiv 2606.17350](https://arxiv.org/abs/2606.17350)
- Research: explicit villain or antagonist personas are played with lower fidelity than good characters. — [arXiv 2511.04962](https://arxiv.org/abs/2511.04962v1)

### Inferences
- A workable style section for DreamWeaver, consistent with the above: a one-sentence narrator role; positive craft rules with reasons (concrete sensory detail, one surprising specific per scene, end on an unresolved question because the reader must want to choose); a short avoid-list drawn from the model's own observed tics; and 3-5 short exemplar scenes that differ from each other in tone and setting so the model does not copy one.
- Few-shot exemplars carry a copying risk for a product that generates thousands of stories: fixed exemplars can become a new source of sameness. Rotating exemplars from a pool in code would mitigate this. This is my reasoning; I did not find a fiction-specific measurement.
- The three choices are a style and plot lever in themselves. Requiring that choices differ in kind (for example one cautious, one bold, one odd), that at least one carries visible risk, and that none simply resolves the problem, addresses conflict avoidance at the point where the reader steers.
- Length caps cut both ways: 2-5 sentences limits purple prose but also pressures the model to summarise ("telling"). Stating what the sentences should do (one action beat, one sensory detail, one hook) is more specific than a sentence count alone.

### Gaps
- No official OpenAI or Anthropic guidance specific to fiction or interactive narration was found.
- No OpenAI prompting guidance specific to gpt-6-luna was found.
- I found no controlled study of "end each scene on tension" instructions or of banned-word lists delivered by prompt (as opposed to decode-time banning).

## 6. Model choice and reasoning effort

### Takeaway
Leaderboards agree that large frontier models write better short fiction than small ones but disagree sharply on ordering, and no small or budget model appears near the top of either main board. Evidence that more reasoning improves fiction is thin: one 2026 paper reports only limited gains, and no study I found measures reasoning effort versus story quality directly, so effort is the least-supported of the three levers.

### Cited Findings

Current model and prices:
- gpt-6-luna: $0.10 per million input tokens, $0.01 cached input, $0.125 cache writes, $0.50 output; Batch and Flex at 50%; reasoning effort levels none, low, medium, high, xhigh, max with medium as default; structured outputs supported; 1,050,000-token context; knowledge cutoff 2026-05-18. — [OpenAI model page](https://developers.openai.com/api/docs/models/gpt-6-luna.md)
- Reasoning tokens bill as output tokens, so higher effort raises cost (third-party explainer); OpenAI is reported to have cut GPT-6 Sol and Luna prices by half or more versus GPT-5.6, and to allow changing reasoning effort without invalidating the prompt cache. — [eesel pricing explainer](https://www.eesel.ai/blog/gpt-6-luna-pricing), [The New Stack](https://thenewstack.io/?p=22837555)
- Larger OpenAI tiers, with conflicting third-party naming (GPT-6 versus 6.1 versus 6.2): Sol about $2 input / $10 output per million; Terra about $1 / $5; Astra $10 / $50. I could not reach OpenAI's pricing page to confirm; verify before relying on these. — [morphllm pricing table](https://morphllm.com/openai-api-pricing), [OpenAI pricing page](https://developers.openai.com/api/docs/pricing)
- Conflict: OpenRouter pages list a "gpt-6-luna-pro" at either $1/$5 or $0.05/$0.25 per million; unresolved. — [OpenRouter](https://openrouter.ai/models/openai/gpt-6-luna-pro)

Benchmarks (all short-form):
- EQ-Bench Creative Writing v3 top 10 as reproduced on 2026-08-31 (Elo / rubric / slop, lower slop is better): claude-opus-5 2116.1 / 85.35 / 0.9; kimi-k3 2070.8 / 84.25 / 1.3; GLM-5.3 2062.4 / 85.20 / 1.2; gpt-5.6-sol 1964.1 / 83.90 / 1.6; ox-alpha 1959.7; claude-fable-5 1933.2; muse-spark-1.1 1915.2; claude-opus-4-7 1906.4; gpt-5.6-terra 1850.0; gpt-5.5 1844.0 / 85.05 / 1.8. The board publishes no as-of date; the scale anchors are ministral-3b at 200 Elo and DeepSeek-R1 at 1500. Pre-dates GPT-6. — [Digital Applied analysis](https://www.digitalapplied.com/blog/which-ai-model-writes-best-leaderboards-disagree), [benchmark repo](https://github.com/EQ-bench/creative-writing-bench)
- arena.ai (LMArena) Creative Writing as of 2026-08-27, 1,214,472 votes over 393 models: claude-fable-5 1505 ± 9 (1st), claude-opus-4-6-high 1500 ± 7, claude-opus-4-7-high 1489 ± 7, gemini-3-pro 1483 ± 8, claude-opus-5-high 1471 ± 9 (10th), kimi-k3-max 1458 ± 11 (23rd). — [Digital Applied analysis](https://www.digitalapplied.com/blog/which-ai-model-writes-best-leaderboards-disagree)
- The two boards "nearly invert" (EQ-Bench's 1st is arena's 10th; EQ-Bench's 2nd is arena's 23rd); within EQ-Bench, rubric and Elo also diverge (gpt-5.5 nearly ties the leader on rubric but sits 272 Elo lower). Neither board ranks a small or budget model near the top. — [Digital Applied analysis](https://www.digitalapplied.com/blog/which-ai-model-writes-best-leaderboards-disagree)
- Arena top-20 spread is narrow: about 40 points separate 1st from 20th, with confidence intervals of ±7 to ±18. — [Digital Applied analysis](https://www.digitalapplied.com/blog/which-ai-model-writes-best-leaderboards-disagree)
- Criticism: Surge AI states that frontier labs have noticed EQ-Bench scores are "often negatively correlated with good creative writing" (Surge sells a competing human-judged benchmark). AutoFiction's authors say Arena and EQ-Bench emphasise short tasks that are poor proxies for long-form writing, especially with LLM judges. — [Surge Hemingway-bench post](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard), [AutoFiction paper](https://genaicreativity.org/icml2026/files/22/22_paper.pdf)
- Other boards exist that I did not open: Lech Mazur's story-writing benchmark and Surge's Hemingway-bench. — [lechmazur/writing](https://github.com/lechmazur/writing), [Hemingway-bench](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard)

Reasoning effort:
- Measured (abstract only): mainstream reasoning models show "limited gains" on open-ended writing because they do not apply reflection and revision there. — [R2-Write, arXiv 2604.03004](https://arxiv.org/abs/2604.03004)
- Measured (judging, not writing): adding distilled chain-of-thought rationales degraded trained creative-writing judges. — [LitBench](https://aclanthology.org/2026.eacl-long.362)
- Benchmark practice: arena lists several top entries in "-high" or "-max" reasoning variants, so top-ranked configurations often use high effort, but the board excerpt does not compare effort levels of the same model. — [Digital Applied analysis](https://www.digitalapplied.com/blog/which-ai-model-writes-best-leaderboards-disagree)
- Vendor: OpenAI recommends starting at medium and moving from none/minimal to low; Anthropic says thinking adds latency and should be used only when it meaningfully improves results. — [OpenAI latest-model guide](https://developers.openai.com/api/docs/guides/latest-model), [Anthropic best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- Anecdote against: one user's report of worse long-form fiction at medium effort. — [OpenAI community thread](https://community.openai.com/t/has-chatgpts-long-form-fiction-writing-regressed-character-autonomy-source-fidelity-emotional-depth-and-narrative-quality-june-november-2026/1412576)

Model size versus method:
- In the 2026 homogeneity study, frontier models in particular converged on a generic "mean" narrative, so a bigger model does not by itself fix sameness. — [arXiv 2606.17350](https://arxiv.org/abs/2606.17350)
- Verbalized Sampling reports that more capable models gain more from the diversity technique. — [arXiv 2510.01171](https://arxiv.org/abs/2510.01171v3)

### Inferences
- Illustrative per-turn text cost (my arithmetic on assumed sizes, not measured): about 3,000 input and 400 output tokens per turn is about $0.0005 on Luna ($0.0003 input + $0.0002 output), so a 60-turn story is about 3 cents of text. On a Sol-class model at the unconfirmed $2/$10 it is about $0.01 per turn, roughly 20x, about 60 cents for 60 turns. Image generation per turn very likely costs more than Luna's text call, so the narrator's share of total cost is small. The image-cost claim is unverified here.
- A hybrid is the natural cost shape: use a stronger model once per story for the hidden arc and perhaps for the ending, and keep Luna for turns. Planning is where the research shows the largest gains, and a one-off call amortises across all turns.
- Raising Luna from low to medium effort is cheap to test but lacks supporting evidence; the plausible benefit is better bookkeeping (bible updates, honouring the plan, varied choices) rather than better prose. Extra reasoning tokens add latency before the first visible token, which matters in a tap-and-wait storybook.
- Because the leaderboards disagree and neither tests interactive, 2-5 sentence, all-ages narration, they are weak guides for this product. A small in-house comparison (section 8) is more informative than either board.
- Order of expected payoff, as a judgement from the evidence: design changes (arc plan, scheduled setbacks, code-injected variety, richer state) first; model upgrade for the planning call second; per-turn model upgrade third; reasoning effort last.

### Gaps
- No benchmark result found for gpt-6-luna, or any GPT-6-family model, on creative writing; the leaderboard snapshots pre-date or omit them.
- No controlled study of reasoning effort versus fiction quality, and no latency figures for Luna at each effort level.
- OpenAI's official price list for Sol and Terra was not reachable; third-party figures conflict in naming.
- Current Anthropic and Google model prices were not collected in this session.

## 7. Structured output / JSON and writing quality

### Takeaway
The evidence that strict formats hurt is about reasoning tasks on 2023-24 models and is contested; I found nothing that measures JSON-constrained output against prose quality in fiction. The low-cost precautions are to order the schema so narration is generated before metadata, and to test a prose-first, extract-second variant if quality seems capped.

### Cited Findings
- Measured: Tam et al. (EMNLP 2024 Industry, "Let Me Speak Freely?") found a significant decline in reasoning performance under format restrictions, worse with stricter constraints, while classification accuracy could improve. They compared constrained decoding (JSON mode), format-restricting instructions, and a two-step "NL-to-Format" approach in which the model answers in natural language and a second step converts to the schema. Models were GPT-3.5-turbo/Claude 3 Haiku/Gemini 1.5 Flash-era. — [arXiv 2408.02442](https://arxiv.org/abs/2408.02442), [ACL Anthology](https://aclanthology.org/2024.emnlp-industry.91)
- Rebuttal: the .txt (Outlines) team's "Say What You Mean" post argued the paper's comparison was confounded by inconsistent prompts and that structured generation matched or beat free text once prompts were made comparable. (not re-fetched; from background knowledge) — [dottxt blog](https://blog.dottxt.co/say-what-you-mean.html)
- Field order: a 2026 AACL paper argues an answer-first schema forces the model to commit before reasoning, so later fields can only justify it; Dylan Castillo reported a statistically significant benefit (p < 0.01) for putting reasoning fields before answer fields; other write-ups argue order matters less for reasoning models. Mostly blogs and small studies. — [AACL 2026 paper](https://aclanthology.org/2026.aacl-long.209.pdf), [Castillo](https://dylancastillo.co/posts/llm-pydantic-order-matters.html), [counterpoint](https://tiny.write.as/kallyaleksiev/does-field-ordering-affect-model-performance)
- Operational caveat: developers have reported OpenAI structured outputs emitting keys in an order different from the one they expected from the schema. Older threads (2024); behaviour may have changed. — [OpenAI community thread](https://community.openai.com/t/key-ordering-issue-in-openai-structured-outputs-despite-specified-sequence-in-json-schema/995040.md)
- Vendor signal that JSON can interact with reasoning: Anthropic's model-specific notes for Sonnet 5.5 include a section on "JSON output on reasoning tasks" (I saw only the index entry, not the content). — [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

### Inferences
- In a single autoregressive call, fields generated earlier condition later ones. A sensible order for DreamWeaver is: a brief private planning field (what changes this scene, what goes wrong, how it ends unresolved), then narration, then choices, then image prompt, then bible updates. Bible updates and image prompt then describe what was actually written, and the narration is not shaped by having already committed to a summary.
- A short planning field costs a few dozen output tokens (output is $0.50 per million on Luna) and acts as a cheap substitute for higher reasoning effort, with the advantage that it can be logged and inspected.
- JSON string escaping discourages paragraph breaks and dialogue formatting slightly, but at 2-5 sentences this is unlikely to matter. The two-call variant (free prose, then a cheap extraction call for choices, image prompt and bible) doubles calls and latency; it is worth an A/B test only if blind comparison shows the JSON version is worse.
- Verify the emitted key order in actual responses rather than assuming it follows the schema.

### Gaps
- No study found on structured output versus creative prose quality, for any model generation.
- I did not verify the current OpenAI documentation on key-order guarantees for strict structured outputs on GPT-6 models.
- The dottxt rebuttal was not re-read this session.

## 8. Evaluation

### Takeaway
Human judgment remains the reference: LLM judges match human story preferences only about three times in four, favour length and style, and are unreliable for long works. A solo developer can still get useful signal from blind pairwise comparison on a fixed set of scripted playthroughs, backed by a few cheap automatic counters.

### Cited Findings
- TTCW: 14 binary tests over fluency, flexibility, originality and elaboration, applied by experts; LLM assessors did not correlate positively with experts (2023-era models). The annotated stories are public. — [arXiv 2309.14556](https://arxiv.org/abs/2309.14556v3), [repo](https://github.com/salesforce/creativity_eval)
- LitBench (EACL 2026): 43,827 training pairs and a 2,480-pair test set from r/WritingPrompts. Best zero-shot judge 73% agreement with human preference; small and open-source judges "fail to evaluate creative writing accurately"; trained reward models 78%; chain-of-thought rationales degraded the generative reward models. The paper notes LLM judges are biased toward length and style over substance and lack internal consistency. — [ACL Anthology](https://aclanthology.org/2026.eacl-long.362), [arXiv 2507.00769](https://arxiv.org/abs/2507.00769v1)
- EQ-Bench Creative Writing v3 uses an LLM judge with rubric scores plus pairwise Elo, publishes a separate word-frequency "slop" metric, costs about $10 in API fees per model, and switched judge on 2026-03-01; rubric and Elo rankings disagree with each other. — [Digital Applied analysis](https://www.digitalapplied.com/blog/which-ai-model-writes-best-leaderboards-disagree), [repo](https://github.com/EQ-bench/creative-writing-bench)
- Lay and expert readers disagree: lay judges preferred AI writing where experts preferred human writing (in-context condition). — [arXiv 2601.18353](https://arxiv.org/abs/2601.18353)
- Automatic diversity and structure measures used in research: Sui Generis score for plot-element uniqueness (correlates moderately with human surprise); arc, turning-point and arousal/valence analysis; over-representation ratios of words and n-grams against a human baseline. — [Echoes in AI](https://arxiv.org/html/2501.00273v2), [Tian et al.](https://arxiv.org/abs/2407.13248v2), [Antislop](https://arxiv.org/abs/2510.15061)
- AutoFiction evaluates long works with human book reviews, chapter comments, paragraph annotations and engagement signals such as reading time, arguing LLM judges are unreliable for long books. — [AutoFiction paper](https://genaicreativity.org/icml2026/files/22/22_paper.pdf)
- Interactive-story research evaluates immersion and agency with human judgment rather than automatic metrics. — [Wu et al., arXiv 2502.17878](https://arxiv.org/html/2502.17878v1)

### Inferences
- A lightweight protocol that fits a solo developer: fix about 10-20 story premises and a scripted choice policy (for example always the first choice, always the last, random with a fixed seed) so variants can be replayed; generate 10-20 turns per variant; compare variants blind and pairwise, reading whole transcripts, and record a single preference plus one-line reason. Pairwise preference is the format with the best human and judge reliability in the cited work.
- An LLM judge (a strong model, not Luna, given the small-judge finding) is usable as a coarse filter for large differences, with order randomised and length controlled, and should be spot-checked against the developer's own blind picks before being trusted.
- Cheap counters that track the documented failure modes: distinct character names across 50 generated stories (stock-name rate); repeated n-grams across stories; number of turns before the first real setback; fraction of scenes ending on an open question; number of open threads over time; whether the ending references an early planted detail; how different the three choices are from each other.
- Product telemetry is the best long-run measure: turns per story, how early readers press the ending button, replays, and abandonment turn. These parallel AutoFiction's engagement signals.
- Because the audience is lay readers and children, expert-style prose rubrics may point the wrong way; "would I want to tap again?" is closer to the product goal.

### Gaps
- No validated rubric found for interactive, turn-based children's storybook narration.
- No published data on how well late-2026 judge models agree with humans on fiction; LitBench's best judge was Claude 3.7 Sonnet.
- WritingBench was only seen as a citation in LitBench's related work, not examined.

## 9. Safety and tone for an all-ages product when adding conflict and stakes

### Takeaway
There is no agreed standard for frightening content in AI-generated children's stories, and research flags a lack of taxonomies and benchmarks. The measured positivity bias of LLMs works in the product's favour for safety, so the adjustment needed is toward real setbacks and stakes within stated limits, with a separate check rather than reliance on the narrator prompt alone.

### Cited Findings
- A children's-story safety taxonomy for narrative text (PG-STORY) includes a violence category that explicitly covers "intense frightening or scary situations", and notes a lack of clear guidelines and benchmark datasets for child content safety. Seen via search summary. — [arXiv 2502.11242](https://arxiv.org/pdf/2502.11242.pdf)
- "LLM Safety for Children" argues there is no comprehensive taxonomy of content harms specific to children and that prior work focused on explicit harms such as grooming. — [arXiv 2502.12552](https://arxiv.org/html/2502.12552v1)
- One pipeline fine-tunes small open models for children's stories and adds a classifier that checks each story segment against children's-literature guidelines, sending flagged segments back for rewriting while keeping the narrative. — [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11675295/)
- AI-generated children's stories often use language too complex for young children; readability and content safety are described as insufficiently addressed. — [arXiv 2605.13709](https://arxiv.org/pdf/2605.13709), [Trustworthiness of children's stories, arXiv 2308.00073](https://arxiv.org/pdf/2308.00073)
- LLM stories skew happier and avoid negative progressions; models play villains with lower fidelity, an effect attributed to safety alignment. — [Tian et al.](https://arxiv.org/abs/2407.13248v2), [Yi et al.](https://arxiv.org/abs/2511.04962v1)
- Reader input is a risk surface in interactive fiction: Hidden Door restricts inputs to a known vocabulary and rejects others. — [Yahoo-syndicated article](https://ca.news.yahoo.com/how-do-you-prevent-an-ai-generated-game-from-losing-the-plot-170002788.html)

### Inferences
- "More conflict" for an all-ages storybook can be specified as stakes and setbacks rather than threat: things get lost, plans fail, rivals outwit the hero, time runs out, a friend is let down. A stated ceiling (peril without injury detail, no gore, no cruelty played for effect, fear resolved within the story) gives the model room to create tension without drifting.
- DreamWeaver's fixed three choices are a safety advantage over free-text input: the reader cannot inject content. If free-text input is ever added, it needs its own moderation.
- The image prompt is a second output channel that needs the same limits, since a tense scene can yield a frightening picture even when the text is mild.
- A cheap independent check (a moderation endpoint or a small classifier call on narration and image prompt, with regenerate-on-flag) follows the classifier-and-rewrite pattern in the literature and avoids relying on one prompt for both excitement and restraint.
- An age band or "gentle / adventurous" setting chosen by the parent would let the conflict level vary without one prompt having to fit every reader.

### Gaps
- No empirical study found on how much peril or conflict children of given ages enjoy or tolerate in AI-narrated stories.
- I did not check OpenAI's current usage policies or moderation tooling for products aimed at minors, nor legal requirements (for example children's privacy rules); these need separate verification.
- Details of the PG-STORY taxonomy were not read in full.
