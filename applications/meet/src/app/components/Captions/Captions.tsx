import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/participants/participantsSlice';
import clsx from '@proton/utils/clsx';

import { useCaptionsAgentLifecycle } from '../../hooks/captions/useCaptionsAgentLifecycle';
import { useCaptionsAgentWaitTimeout } from '../../hooks/captions/useCaptionsAgentWaitTimeout';
import { useCaptionsPreference } from '../../hooks/captions/useCaptionsPreference';
import { useCleanupCaptions } from '../../hooks/captions/useCleanupCaptions';
import { useLiveCaptionsFeatureEnabled } from '../../hooks/captions/useLiveCaptionsFeatureEnabled';
import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import type { CaptionSegment, CaptionsStatus } from './useTranscriptions';
import { useTranscriptions } from './useTranscriptions';

import './Captions.scss';

interface CaptionLineProps {
    segment: CaptionSegment;
    speakerName?: string;
    isNewest: boolean;
}

const CaptionLine = ({ segment, speakerName, isNewest }: CaptionLineProps) => {
    const { participantColors } = useParticipantDisplayColors(segment.speakerIdentity);

    return (
        <div
            className={clsx(
                'captions__line inline-flex flex-nowrap gap-2 text-center',
                isNewest ? 'captions__line--newest' : 'captions__line--old'
            )}
        >
            {speakerName && (
                <span className={clsx('text-semibold', participantColors.profileTextColor)}>{speakerName}:</span>
            )}
            <span className="captions__text color-norm text-break">
                {segment.text}
                {/* Keyed on the text so each update restarts the animation that hides the cursor. */}
                <span key={segment.text} className="captions__cursor" aria-hidden="true" />
            </span>
        </div>
    );
};

const getStatusMessage = (status: CaptionsStatus) => {
    switch (status) {
        case 'loading':
            return { text: c('Info').t`Loading…`, color: 'color-disabled' };
        case 'ready':
            return { text: c('Info').t`Captions are on`, color: 'color-disabled' };
        case 'failing':
            return {
                text: c('Error').t`Live captions aren't working. Try turning them off and on again.`,
                color: 'color-danger',
            };
        case 'active':
            return null;
    }
};

const CaptionsFeed = () => {
    const { segments, status } = useTranscriptions();
    const nameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    const statusMessage = getStatusMessage(status);
    const centerContent = segments.length <= 1;

    return (
        <div
            className={clsx(
                'captions overflow-hidden flex flex-column flex-nowrap items-center gap-1',
                centerContent ? 'justify-center' : 'justify-end'
            )}
            aria-live="polite"
        >
            {statusMessage ? (
                <div className="captions__line captions__line--newest inline-flex flex-nowrap gap-2 text-center">
                    <span className={statusMessage.color}>{statusMessage.text}</span>
                </div>
            ) : (
                segments.map((seg, index) => (
                    <CaptionLine
                        key={seg.id}
                        segment={seg}
                        speakerName={nameMap[seg.speakerIdentity]}
                        isNewest={index === segments.length - 1}
                    />
                ))
            )}
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

    if (!wantsCaptions) {
        return null;
    }

    return <CaptionsFeed />;
};

export const Captions = () => {
    const featureEnabled = useLiveCaptionsFeatureEnabled();

    if (!featureEnabled) {
        return null;
    }

    return (
        <>
            <CaptionsAgentLifecycle />
            <CaptionsDisplay />
        </>
    );
};
