import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/participants/participantsSlice';
import clsx from '@proton/utils/clsx';

import { useCaptionsSimStatus } from '../../dev/captionsSimStore';
import { useCaptionsAgentLifecycle } from '../../hooks/captions/useCaptionsAgentLifecycle';
import { useCaptionsAgentWaitTimeout } from '../../hooks/captions/useCaptionsAgentWaitTimeout';
import { useCaptionsPreference } from '../../hooks/captions/useCaptionsPreference';
import { useCleanupCaptions } from '../../hooks/captions/useCleanupCaptions';
import { useLiveCaptionsFeatureEnabled } from '../../hooks/captions/useLiveCaptionsFeatureEnabled';
import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import type { CaptionSegment, CaptionsStatus } from './useTranscriptions';
import { useTranscriptions } from './useTranscriptions';

import './Captions.scss';

// Sub-pixel scroll positions mean "at the bottom" is never an exact match.
const FOLLOW_THRESHOLD_PX = 8;

interface CaptionLineProps {
    segment: CaptionSegment;
    speakerName?: string;
    isNewest: boolean;
}

const CaptionLine = ({ segment, speakerName, isNewest }: CaptionLineProps) => {
    const { participantColors } = useParticipantDisplayColors(segment.speakerIdentity);

    return (
        <div className="captions__line flex flex-column flex-nowrap">
            {speakerName && (
                <span
                    className={clsx(
                        'captions__speaker text-semibold text-ellipsis',
                        participantColors.profileTextColor
                    )}
                    title={speakerName}
                >
                    {speakerName}:
                </span>
            )}
            <span className={clsx('captions__text text-break', isNewest ? 'color-norm' : 'color-weak')}>
                {segment.text}
                {/* Keyed on the text so each update restarts the animation that hides the cursor. */}
                <span key={segment.text} className="captions__cursor" aria-hidden="true" />
            </span>
        </div>
    );
};

const LoadingDots = () => (
    <span className="captions__loading-dots inline-flex flex-nowrap items-center" aria-hidden="true">
        <span />
        <span />
        <span />
    </span>
);

const CaptionsError = ({ title, detail }: { title: string; detail: string }) => (
    <div className="captions__status flex flex-column flex-nowrap items-center text-center">
        <span className="text-semibold color-danger">{title}</span>
        <span className="captions__status-detail color-hint">{detail}</span>
    </div>
);

const CaptionsStatusMessage = ({ status }: { status: Exclude<CaptionsStatus, 'active'> }) => {
    switch (status) {
        case 'loading':
            return (
                <div className="captions__status flex flex-nowrap items-center justify-center color-hint">
                    <LoadingDots />
                    <span>{c('Info').t`Loading captions…`}</span>
                </div>
            );
        case 'ready':
            return (
                <div className="captions__status flex flex-column flex-nowrap items-center text-center">
                    <span className="color-weak">{c('Info').t`Captions on`}</span>
                    <span className="captions__status-detail color-hint">{c('Info').t`Waiting for speech…`}</span>
                </div>
            );
        case 'failing':
            return (
                <CaptionsError
                    title={c('Error').t`Unable to generate captions`}
                    detail={c('Error').t`Try turning live captions off and on again.`}
                />
            );
        case 'disconnected':
            return (
                <CaptionsError
                    title={c('Error').t`Unable to generate captions`}
                    detail={c('Error').t`Connection lost — captions will resume when reconnected`}
                />
            );
    }
};

const CaptionsFeed = () => {
    const { segments, status } = useTranscriptions();
    const nameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    // Follows the newest line until the user scrolls up to read back, and resumes once they return.
    const followNewestRef = useRef(true);

    // Watching sizes rather than segments also catches the band shrinking (rotation, on-screen
    // keyboard) and a speaker name resolving after its line rendered, during a pause in speech.
    useEffect(() => {
        const scroller = scrollRef.current;
        const content = contentRef.current;
        if (!scroller || !content) {
            return;
        }
        const observer = new ResizeObserver(() => {
            if (followNewestRef.current) {
                scroller.scrollTop = scroller.scrollHeight;
            }
        });
        observer.observe(scroller);
        observer.observe(content);
        return () => observer.disconnect();
    }, []);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (el) {
            followNewestRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_THRESHOLD_PX;
            // Anchoring keeps a reader's place as old lines drop off the top, but while following it
            // would shift the view up instead (with no size change for the observer to undo).
            el.style.overflowAnchor = followNewestRef.current ? 'none' : 'auto';
        }
    };

    return (
        <div
            ref={scrollRef}
            className="captions scrollbar-always-visible flex flex-column flex-nowrap"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Safari doesn't make scroll containers keyboard-focusable on its own
            tabIndex={0}
            role="log"
            aria-label={c('Label').t`Live captions`}
            aria-live="polite"
            onScroll={handleScroll}
        >
            <div ref={contentRef} className="captions__content flex flex-column flex-nowrap">
                {status !== 'active' ? (
                    <CaptionsStatusMessage status={status} />
                ) : (
                    segments.map((seg, index) => {
                        // Consecutive lines from one speaker read as a single block under one name.
                        const continuesSpeaker =
                            Boolean(seg.speakerIdentity) &&
                            segments[index - 1]?.speakerIdentity === seg.speakerIdentity;
                        return (
                            <CaptionLine
                                key={seg.id}
                                segment={seg}
                                speakerName={continuesSpeaker ? undefined : nameMap[seg.speakerIdentity]}
                                isNewest={index === segments.length - 1}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};

// Both hooks watch participant attributes, so they live in a component that renders nothing: their
// updates would otherwise re-render everything below whoever hosts them.
const CaptionsAgentLifecycle = () => {
    useCaptionsAgentLifecycle();
    useCaptionsAgentWaitTimeout();
    useCleanupCaptions();

    return null;
};

const CaptionsDisplay = () => {
    const { wantsCaptions } = useCaptionsPreference();
    const simulated = useCaptionsSimStatus() !== 'off';

    if (!wantsCaptions && !simulated) {
        return null;
    }

    return <CaptionsFeed />;
};

export const Captions = () => {
    const featureEnabled = useLiveCaptionsFeatureEnabled();
    // Simulated captions skip the agent entirely, so they don't need the feature to be enabled.
    const simulated = useCaptionsSimStatus() !== 'off';

    if (!featureEnabled) {
        return simulated ? <CaptionsFeed /> : null;
    }

    return (
        <>
            <CaptionsAgentLifecycle />
            <CaptionsDisplay />
        </>
    );
};
