import { c, msgid } from 'ttag';

import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectInstantMeeting, selectMaxParticipants } from '@proton/meet/store/slices/currentMeeting';
import { selectIsLocalParticipantAdminOrHost } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectTotalParticipantCount } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest, selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import isTruthy from '@proton/utils/isTruthy';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import { getHiddenParticipantWarningTitle, useHiddenParticipantWarning } from '../hooks/useHiddenParticipantWarning';

type ParticipantCountIndicatorStatus = 'default' | 'warning' | 'danger';

const getCapacityLabel = (status: ParticipantCountIndicatorStatus) => {
    switch (status) {
        case 'warning':
            return c('Info').t`Meeting almost full`;
        case 'danger':
            return c('Info').t`Meeting full`;
        case 'default':
            return undefined;
    }
};

export const useParticipantCountIndicator = () => {
    const isGuest = useMeetSelector(selectIsGuest);
    const instantMeeting = useMeetSelector(selectInstantMeeting);
    const maxParticipants = useMeetSelector(selectMaxParticipants);
    const totalParticipantCount = useMeetSelector(selectTotalParticipantCount);
    const isLocalParticipantAdminOrHost = useMeetSelector(selectIsLocalParticipantAdminOrHost);
    const hiddenParticipantCount = useHiddenParticipantWarning();

    const getCapacityStatus = (): ParticipantCountIndicatorStatus => {
        if (!isLocalParticipantAdminOrHost && !(isGuest && instantMeeting)) {
            return 'default';
        }

        if (maxParticipants === 0) {
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

    const capacityStatus = getCapacityStatus();
    const capacityLabel = getCapacityLabel(capacityStatus);

    if (hiddenParticipantCount > 0) {
        return {
            totalParticipantCount,
            maxParticipants,
            indicatorContent: (
                <span className="text-nowrap">
                    {totalParticipantCount}
                    <span aria-hidden="true">{' !'}</span>
                </span>
            ),
            indicatorStatus: 'warning' as const,
            indicatorDescription: [getHiddenParticipantWarningTitle(hiddenParticipantCount), capacityLabel]
                .filter(isTruthy)
                .join('. '),
        };
    }

    return {
        totalParticipantCount,
        maxParticipants,
        indicatorContent: totalParticipantCount.toString(),
        indicatorStatus: capacityStatus,
        indicatorDescription: capacityLabel,
    };
};

export const ParticipantsButton = () => {
    const dispatch = useMeetDispatch();
    const { totalParticipantCount, maxParticipants, indicatorContent, indicatorStatus, indicatorDescription } =
        useParticipantCountIndicator();
    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);

    const sideBarState = useMeetSelector(selectSideBarState);

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
            indicatorContent={indicatorContent}
            indicatorStatus={indicatorStatus}
            indicatorDescription={indicatorDescription}
            ariaLabel={c('Alt').t`Toggle participants`}
            ariaPressed={sideBarState[MeetingSideBars.Participants]}
            tooltipTitle={getParticipantButtonTooltipTitle()}
        />
    );
};
