import { c, msgid } from 'ttag';

import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectInstantMeeting, selectMaxParticipants } from '@proton/meet/store/slices/meetingInfo';
import { selectIsLocalParticipantAdminOrHost } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectTotalParticipantCount } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest, selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';

import { CircleButton } from '../atoms/CircleButton/CircleButton';

export const ParticipantsButton = () => {
    const dispatch = useMeetDispatch();
    const isGuest = useMeetSelector(selectIsGuest);
    const instantMeeting = useMeetSelector(selectInstantMeeting);
    const maxParticipants = useMeetSelector(selectMaxParticipants);
    const totalParticipantCount = useMeetSelector(selectTotalParticipantCount);
    const isLocalParticipantAdminOrHost = useMeetSelector(selectIsLocalParticipantAdminOrHost);
    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);

    const sideBarState = useMeetSelector(selectSideBarState);

    const getParticipantCountIndicatorVariant = () => {
        if (!isLocalParticipantAdminOrHost && !(isGuest && instantMeeting)) {
            return 'default';
        }

        if (0.9 * maxParticipants <= totalParticipantCount && totalParticipantCount < maxParticipants) {
            return 'warning';
        }

        if (totalParticipantCount >= maxParticipants) {
            return 'danger';
        }

        return 'default';
    };

    const getParticipantButtonTooltipTitle = () => {
        if (maxParticipants === 0) {
            return c('Info').ngettext(
                msgid`${totalParticipantCount} participant`,
                `${totalParticipantCount} participants`,
                totalParticipantCount
            );
        }

        if (isPaidUser) {
            return totalParticipantCount >= maxParticipants
                ? c('Info').t`Meeting full (${maxParticipants} participants)`
                : c('Info').t`${totalParticipantCount} of up to ${maxParticipants} participants`;
        }

        return totalParticipantCount >= maxParticipants
            ? c('Info').t`${maxParticipants} participant limit reached`
            : c('Info').t`${totalParticipantCount} of up to ${maxParticipants} participants`;
    };

    return (
        <CircleButton
            IconComponent={IcMeetParticipants}
            variant={sideBarState[MeetingSideBars.Participants] ? 'active' : 'default'}
            onClick={() => {
                dispatch(toggleSideBarState(MeetingSideBars.Participants));
            }}
            indicatorContent={totalParticipantCount.toString()}
            indicatorStatus={getParticipantCountIndicatorVariant()}
            ariaLabel={c('Alt').t`Toggle participants`}
            ariaPressed={sideBarState[MeetingSideBars.Participants]}
            tooltipTitle={getParticipantButtonTooltipTitle()}
        />
    );
};
