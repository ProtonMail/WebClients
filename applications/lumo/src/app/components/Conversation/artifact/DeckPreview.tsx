import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useLumoSelector } from '../../../redux/hooks';
import { selectAttachments } from '../../../redux/selectors';
import { findUnsourcedNumbers } from '../../../util/slides/checks/dataChecks';
import { readDeckContent } from '../../../util/slides/deckContent';
import { collectDeckSourceText } from '../../../util/slides/deckSources';
import { layoutDeck } from '../../../util/slides/layoutDeck';
import { useOptionalArtifactContext } from './ArtifactContext';
import { DeckChecks } from './DeckChecks';
import { DeckSlide, SLIDE_WIDTH_PX } from './DeckSlide';
import type { ParsedArtifact } from './parseArtifacts';

/** Horizontal padding around the slides, matching `p-4`. */
const PADDING_PX = 16;

interface Props {
    artifact: ParsedArtifact;
}

/**
 * The canvas view of a JSON deck (D18): the checks to make before sharing, then every slide as it
 * will look in the .pptx, with its speaker notes.
 */
export const DeckPreview = memo(function DeckPreview({ artifact }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const context = useOptionalArtifactContext();
    const attachments = useLumoSelector(selectAttachments);

    const parsed = readDeckContent(artifact.content);
    const deck = parsed?.deck ?? null;
    const laidOut = useMemo(() => {
        return deck ? layoutDeck(deck) : null;
    }, [deck]);

    // The source material is what the conversation held when this version was made. The version is
    // found from the deck being drawn rather than the panel's selection, which is still empty while
    // a new creation auto-opens.
    const versions = context?.registry[artifact.id]?.versions;
    const messageId = versions?.findLast((version) => {
        return version.content === artifact.content;
    })?.messageId;
    const getLinearChain = context?.getLinearChain;
    // Recomputed when the deck, its version or the attachments change; the sources for a version
    // are the messages up to it, which don't change afterwards.
    const findings = useMemo(() => {
        // Without the version's message, later messages would count as sources: no check rather than a wrong one.
        if (!deck || !getLinearChain || !messageId) {
            return [];
        }
        return findUnsourcedNumbers(deck, collectDeckSourceText(getLinearChain(), attachments, messageId));
    }, [deck, getLinearChain, attachments, messageId]);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) {
            return;
        }
        const observer = new ResizeObserver(() => {
            setWidth(Math.min(element.clientWidth - 2 * PADDING_PX, SLIDE_WIDTH_PX));
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, []);

    if (!laidOut) {
        return (
            <p className="color-weak text-sm p-4">{c('collider_2025: Error').t`This slide deck couldn't be read.`}</p>
        );
    }

    const slideNumberFor = (sourceSlide: number): number => {
        const index = laidOut.slides.findIndex((slide) => {
            return slide.sourceSlide === sourceSlide;
        });
        return index + 1;
    };

    return (
        <div ref={containerRef} className="flex-1 min-h-0 overflow-auto bg-weak">
            <div className="flex flex-column items-center gap-4 p-4">
                <div style={{ width }}>
                    <DeckChecks findings={findings} gaps={laidOut.gaps} slideNumberFor={slideNumberFor} />
                </div>
                {width > 0 &&
                    laidOut.slides.map((slide, index) => {
                        const slideNumber = index + 1;
                        return (
                            <section key={index} className="flex flex-column gap-1" style={{ width }}>
                                <span className="text-xs color-weak">{c('collider_2025: Info')
                                    .t`Slide ${slideNumber}`}</span>
                                <DeckSlide slide={slide} width={width} />
                                {slide.notes && (
                                    <p className="m-0 text-sm color-weak text-pre-wrap">
                                        <span className="text-semibold">{c('collider_2025: Info').t`Notes:`}</span>{' '}
                                        {slide.notes}
                                    </p>
                                )}
                            </section>
                        );
                    })}
            </div>
        </div>
    );
});
