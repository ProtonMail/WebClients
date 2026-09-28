import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { MeetingSideBars, openSideBar } from '@proton/meet/store/slices/uiStateSlice';

export const ParticipantCountMismatchTopBanner = () => {
    const dispatch = useMeetDispatch();

    return (
        <div className="flex flex-nowrap gap-2 items-center justify-center">
            <span>{c('Info').t`Participant counts don’t match`}</span>
            <InlineLinkButton
                onClick={() => {
                    dispatch(openSideBar(MeetingSideBars.MeetingDetails));
                }}
            >
                {c('Action').t`View security details`}
            </InlineLinkButton>
        </div>
    );
};
