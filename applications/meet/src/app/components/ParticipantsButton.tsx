import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectInstantMeeting, selectMaxParticipants } from '@proton/meet/store/slices/meetingInfo';
import { selectTotalParticipantCount } from '@proton/meet/store/slices/sortedParticipantsSlice';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import { useGuestContext } from '../contexts/GuestProvider/GuestContext';

export const ParticipantsButton = ({
    hasAdminPermission,
    isPaid,
}: {
    hasAdminPermission: boolean;
    isPaid: boolean;
}) => {
    const dispatch = useMeetDispatch();
    const isGuest = useGuestContext();
    const instantMeeting = useMeetSelector(selectInstantMeeting);
    const maxParticipants = useMeetSelector(selectMaxParticipants);
    const totalParticipantCount = useMeetSelector(selectTotalParticipantCount);

    const sideBarState = useMeetSelector(selectSideBarState);

    const getParticipantsCount = () => {
        if (hasAdminPermission || (isGuest && instantMeeting)) {
            if (maxParticipants && maxParticipants < 10) {
                return (
                    <div>
                        <span>{totalParticipantCount}</span>
                        <span className="color-weak">/{maxParticipants}</span>
                    </div>
                );
            } else {
                return totalParticipantCount.toString();
            }
        }
        return undefined;
    };

    const getParticipantCountIndicatorVariant = () => {
        if (!hasAdminPermission && !(isGuest && instantMeeting)) {
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

        if (isPaid) {
            return totalParticipantCount >= maxParticipants
                ? c('Info').t`Meeting full (${maxParticipants} participants)`
                : c('Info').t`${totalParticipantCount} of ${maxParticipants} participants`;
        }

        return totalParticipantCount >= maxParticipants
            ? c('Info').t`${maxParticipants} participant limit reached`
            : c('Info').t`${totalParticipantCount} of ${maxParticipants} participants`;
    };

    return (
        <CircleButton
            IconComponent={IcMeetParticipants}
            variant={sideBarState[MeetingSideBars.Participants] ? 'active' : 'default'}
            onClick={() => {
                dispatch(toggleSideBarState(MeetingSideBars.Participants));
            }}
            indicatorContent={getParticipantsCount()}
            indicatorStatus={getParticipantCountIndicatorVariant()}
            ariaLabel={c('Alt').t`Toggle participants`}
            tooltipTitle={getParticipantButtonTooltipTitle()}
        />
    );
};

export const WrappedParticipantsButton = ({ hasAdminPermission }: { hasAdminPermission: boolean }) => {
    const [user] = useUser();
    return <ParticipantsButton hasAdminPermission={hasAdminPermission} isPaid={user?.hasPaidMeet} />;
};
