/**
 * Page for comparing the canvas preview with the .pptx (development only). Draws every slide of
 * every eval fixture with the panel's DeckSlide, at the slide's native 960 px width. Bundled and
 * screenshotted by comparePreview.ts.
 */
import { createRoot } from 'react-dom/client';

import { DeckSlide } from '../../src/app/components/Conversation/artifact/DeckSlide';
import { parseDeck } from '../../src/app/util/slides/deck';
import { SLIDES_EVAL_FIXTURES } from '../../src/app/util/slides/eval/slidesEvalFixtures';
import { layoutDeck } from '../../src/app/util/slides/layoutDeck';

const Harness = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, background: '#9a9aa5' }}>
            {SLIDES_EVAL_FIXTURES.flatMap((fixture) => {
                const deck = parseDeck(fixture.modelOutput).deck;
                if (!deck) {
                    return [];
                }
                return layoutDeck(deck).slides.map((slide, index) => {
                    return (
                        <div
                            key={`${fixture.id}-${index}`}
                            data-slide={`${fixture.id}-slide${index + 1}`}
                            style={{ width: 960 }}
                        >
                            <DeckSlide slide={slide} width={960} />
                        </div>
                    );
                });
            })}
        </div>
    );
};

createRoot(document.getElementById('root')!).render(<Harness />);
