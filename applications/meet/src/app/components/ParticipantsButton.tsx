import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import { useMeetContext } from '../contexts/MeetContext';
import { useUIStateContext } from '../contexts/UIStateContext';
import { MeetingSideBars } from '../types';

export const ParticipantsButton = ({
    hasAdminPermission,
    isPaid,
}: {
    hasAdminPermission: boolean;
    isPaid: boolean;
}) => {
    const { maxParticipants, guestMode, instantMeeting, participants } = useMeetContext();

    const participantCount = participants.length;

    const { sideBarState, toggleSideBarState } = useUIStateContext();

    const getParticipantsCount = () => {
        if (hasAdminPermission || (guestMode && instantMeeting)) {
            if (maxParticipants && maxParticipants < 10) {
                return (
                    <div>
                        <span>{participantCount}</span>
                        <span className="color-weak">/{maxParticipants}</span>
                    </div>
                );
            } else {
                return participantCount.toString();
            }
        }
        return undefined;
    };

    const getParticipantCountIndicatorVariant = () => {
        if (!hasAdminPermission && !(guestMode && instantMeeting)) {
            return 'default';
        }

        if (0.9 * maxParticipants <= participantCount && participantCount < maxParticipants) {
            return 'warning';
        }

        if (participantCount >= maxParticipants) {
            return 'danger';
        }

        return 'default';
    };

    const getParticipantButtonTooltipTitle = () => {
        if (maxParticipants === 0) {
            return c('Info').ngettext(
                msgid`${participantCount} participant`,
                `${participantCount} participants`,
                participantCount
            );
        }

        if (isPaid) {
            return participantCount >= maxParticipants
                ? c('Info').t`Meeting full (${maxParticipants} participants)`
                : c('Info').t`${participantCount} of ${maxParticipants} participants`;
        }

        return participantCount >= maxParticipants
            ? c('Info').t`${maxParticipants} participant limit reached`
            : c('Info').t`${participantCount} of ${maxParticipants} participants`;
    };

    return (
        <CircleButton
            IconComponent={IcMeetParticipants}
            variant={sideBarState[MeetingSideBars.Participants] ? 'active' : 'default'}
            onClick={() => {
                toggleSideBarState(MeetingSideBars.Participants);
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
