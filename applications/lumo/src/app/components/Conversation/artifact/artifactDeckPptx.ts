import { readDeckContent } from '../../../util/slides/deckContent';
import { deckToPptxBytes } from '../../../util/slides/deckToPptx';
import { layoutDeck } from '../../../util/slides/layoutDeck';
import type { ParsedArtifact } from './parseArtifacts';

/** A JSON deck's native .pptx (D18): the same layout the canvas preview draws. */
export async function buildDeckPptxBytes(artifact: ParsedArtifact): Promise<ArrayBuffer> {
    const deck = readDeckContent(artifact.content)?.deck;
    if (!deck) {
        throw new Error('Slide deck could not be read.');
    }
    return deckToPptxBytes(layoutDeck(deck));
}
