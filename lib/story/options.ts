// The choices a reader makes once, when a story starts.

export const READING_LEVELS = {
  early: {
    label: 'Little readers',
    hint: 'Short, simple sentences',
    instruction:
      'Write for a child of five to seven who is learning to read: very short sentences that can be said in one breath, everyday words, one idea per sentence. Use two or three sentences per turn. Use a repeating phrase or pattern the child can join in with, changed a little each time. Setbacks are funny or surprising, never frightening: things tip over, get stuck, go missing. Keep choices to a few simple words.',
    ceiling:
      'Nothing truly scary: no monsters that mean harm, nobody hurt, nobody lost for long. Worry is always followed quickly by comfort.',
  },
  family: {
    label: 'Family',
    hint: 'For reading together',
    instruction:
      'Write for a family reading together: clear, lively language a nine-year-old can follow and an adult will enjoy, with humour that works for both. Use two to four sentences per turn.',
    ceiling:
      'Gentle peril is welcome: chases, narrow escapes, a villain who is really a threat. No injury detail, no cruelty, and fear is always answered within the story.',
  },
  advanced: {
    label: 'Confident readers',
    hint: 'For teens and adults',
    instruction:
      'Write for teenagers and adults: richer vocabulary, subtext, wit and subtler emotion, in three to five sentences per turn. Trust the reader: imply rather than explain, let characters want things they do not say, and let actions have costs that last. Choices should be real dilemmas where every option gives something up, and not everything needs to end happily.',
    ceiling:
      'Real stakes are welcome: menace, loss, betrayal, moral grey areas, melancholy. Keep it non-graphic: no gore, no sexual content, no cruelty for its own sake.',
  },
} as const;

export type ReadingLevel = keyof typeof READING_LEVELS;
export const DEFAULT_READING_LEVEL: ReadingLevel = 'family';

const NO_TEXT = 'No text, letters or captions in the image.';

export const ART_STYLES = {
  watercolor: {
    label: 'Watercolour',
    prompt: `Watercolor storybook illustration in a whimsical hand-painted style, warm lighting, soft edges, children's book aesthetic, detailed and charming. ${NO_TEXT}`,
  },
  ink: {
    label: 'Pen and ink',
    prompt: `Classic pen-and-ink storybook illustration with fine cross-hatching and a light sepia wash, in the manner of a vintage children's novel, detailed and characterful. ${NO_TEXT}`,
  },
  papercut: {
    label: 'Paper cut-out',
    prompt: `Layered paper cut-out collage illustration: bold simple shapes of textured coloured paper with soft drop shadows between the layers, playful and tactile. ${NO_TEXT}`,
  },
  pastel: {
    label: 'Soft pastel',
    prompt: `Soft chalk-pastel storybook illustration on textured paper, gentle blended colours, glowing light and dreamy atmosphere. ${NO_TEXT}`,
  },
  pixel: {
    label: 'Pixel art',
    prompt: `Detailed 16-bit pixel art scene in the style of a classic adventure videogame, crisp pixels, a limited harmonious palette and cosy lighting. ${NO_TEXT}`,
  },
  comic: {
    label: 'Comic book',
    prompt: `Bright comic-book illustration with confident ink outlines, flat cel shading and dynamic composition, friendly and adventurous. ${NO_TEXT}`,
  },
} as const;

export type ArtStyle = keyof typeof ART_STYLES;
export const DEFAULT_ART_STYLE: ArtStyle = 'watercolor';

export const isReadingLevel = (value: unknown): value is ReadingLevel =>
  typeof value === 'string' && value in READING_LEVELS;

export const isArtStyle = (value: unknown): value is ArtStyle =>
  typeof value === 'string' && value in ART_STYLES;

/** Limits for the character creator. */
export const CHARACTER_LIMITS = {
  nameMaxLength: 40,
  descriptionMaxLength: 1200,
  portraitOptions: 3,
  maxPerUser: 8,
} as const;
