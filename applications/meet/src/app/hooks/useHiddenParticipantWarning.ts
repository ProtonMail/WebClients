import { c, msgid } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectHiddenParticipantCount } from '@proton/meet/store/slices/participantCountMismatchListener';
import { useFlag } from '@proton/unleash/useFlag';

import { MismatchStage, useMismatchStage } from './useMismatchStage';

export const getHiddenParticipantWarningTitle = (count: number) => {
    // translator: people who can decrypt the call but are not connected to it, e.g. "3 people have access but aren't in the call"
    return c('Info').ngettext(
        msgid`${count} person has access but isn't in the call`,
        `${count} people have access but aren't in the call`,
        count
    );
};

export const useHiddenParticipantWarningCount = (): number => {
    const isHiddenParticipantWarningEnabled = useFlag('MeetHiddenParticipantWarning');
    const mismatchStage = useMismatchStage();
    const hiddenParticipantCount = useMeetSelector(selectHiddenParticipantCount);

    if (!isHiddenParticipantWarningEnabled || mismatchStage !== MismatchStage.Warning) {
        return 0;
    }

    return hiddenParticipantCount;
};
