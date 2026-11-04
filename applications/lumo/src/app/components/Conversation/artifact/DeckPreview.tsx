import { memo, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useConversationActions } from '../../../providers/ConversationActionsProvider';
import { useLumoSelector } from '../../../redux/hooks';
import { selectAttachments } from '../../../redux/selectors';
import { findUnsourcedNumbers } from '../../../util/slides/checks/dataChecks';
import { readDeckContent } from '../../../util/slides/deckContent';
import { collectDeckSourceText } from '../../../util/slides/deckSources';
import { layoutDeck } from '../../../util/slides/layoutDeck';
import { useOptionalArtifactContext } from './ArtifactContext';
import { DeckChecks } from './DeckChecks';
import { DeckSlide, SLIDE_WIDTH_PX } from './DeckSlide';
import { selectWholeField } from './deckSelection';
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
    // A state ref, not `useRef`: the container is only mounted once the deck can be read, which may be
    // after the first render while it streams in or after a fix, and the observer must attach then.
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    const context = useOptionalArtifactContext();
    const attachments = useLumoSelector(selectAttachments);
    const { handleSendArtifactAction } = useConversationActions();

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
        if (!container) {
            return;
        }
        const observer = new ResizeObserver(() => {
            setWidth(Math.min(container.clientWidth - 2 * PADDING_PX, SLIDE_WIDTH_PX));
        });
        observer.observe(container);
        return () => {
            observer.disconnect();
        };
    }, [container]);

    if (!laidOut) {
        const errorIssues = parsed?.issues.filter((issue) => {
            return issue.severity === 'error';
        });
        const errorSummary = errorIssues?.length
            ? errorIssues.map((issue) => {
                  return issue.message;
              })
            : ['The deck JSON could not be read.'];

        const handleFix = () => {
            const issueList = errorSummary.join('; ');
            void handleSendArtifactAction(
                {
                    kind: 'edit',
                    artifactId: artifact.id,
                    artifactTitle: artifact.title,
                    artifactType: artifact.type,
                    selection: issueList,
                    userInstruction: c('collider_2025: Prefill')
                        .t`Rewrite the deck JSON to fix these parse errors and produce a valid slide deck.`,
                },
                false
            );
        };

        return (
            <div className="flex flex-column items-center justify-center gap-3 p-8 flex-1 min-h-0">
                <p className="m-0 color-weak text-sm text-center">
                    {c('collider_2025: Error').t`This slide deck couldn't be read.`}
                </p>
                <Button size="small" shape="outline" onClick={handleFix}>
                    {c('collider_2025: Action').t`Fix with ${LUMO_SHORT_APP_NAME}`}
                </Button>
            </div>
        );
    }

    const slideNumberFor = (sourceSlide: number): number => {
        const index = laidOut.slides.findIndex((slide) => {
            return slide.sourceSlide === sourceSlide;
        });
        return index + 1;
    };

    return (
        <div ref={setContainer} className="artifact-deck-content flex-1 min-h-0 overflow-auto bg-weak">
            <div className="flex flex-column items-center gap-4 p-4">
                <div style={{ width }}>
                    <DeckChecks findings={findings} gaps={laidOut.gaps} slideNumberFor={slideNumberFor} />
                </div>
                {width > 0 &&
                    laidOut.slides.map((slide, index) => {
                        const slideNumber = index + 1;
                        return (
                            <section key={index} className="flex flex-column gap-1" style={{ width }}>
                                <span className="text-xs color-weak user-select-none">{c('collider_2025: Info')
                                    .t`Slide ${slideNumber}`}</span>
                                <DeckSlide slide={slide} width={width} selectable />
                                {slide.notes && (
                                    <p className="m-0 text-sm color-weak text-pre-wrap">
                                        <span className="text-semibold user-select-none">{c('collider_2025: Info')
                                            .t`Notes:`}</span>{' '}
                                        {/* A click selects all the notes; dragging still selects part of them. A mouse
                                            shortcut for a text selection, not a control. */}
                                        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                                        <span
                                            className="cursor-pointer"
                                            onMouseUp={selectWholeField}
                                            data-deck-slide={slide.sourceSlide}
                                            data-deck-field="notes"
                                            data-deck-text={slide.notes}
                                        >
                                            {slide.notes}
                                        </span>
                                    </p>
                                )}
                            </section>
                        );
                    })}
            </div>
        </div>
    );
});
