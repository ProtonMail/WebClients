import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { MeetingSideBars, openSideBar } from '@proton/meet/store/slices/uiStateSlice';

import {
    getHiddenParticipantWarningTitle,
    useHiddenParticipantWarning,
} from '../../../hooks/useHiddenParticipantWarning';

export const HiddenParticipantWarning = () => {
    const dispatch = useMeetDispatch();
    const hiddenParticipantCount = useHiddenParticipantWarning();

    if (hiddenParticipantCount === 0) {
        return null;
    }

    return (
        <div
            className="hidden-participant-warning shrink-0 mx-4 mb-2 p-4 rounded-xl text-sm color-warning"
            style={{
                backgroundColor: 'var(--signal-warning-minor-2)',
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: 1.5,
            }}
        >
            <p className="m-0">{getHiddenParticipantWarningTitle(hiddenParticipantCount)}</p>
            <p className="m-0">{c('Info').t`This usually means a lost connection. It should clear on its own.`}</p>
            <InlineLinkButton
                className="color-inherit mt-2"
                onClick={() => {
                    dispatch(openSideBar(MeetingSideBars.MeetingDetails));
                }}
            >
                {c('Action').t`View security details`}
            </InlineLinkButton>
        </div>
    );
};
