import { c, msgid } from 'ttag';

import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectInstantMeeting, selectMaxParticipants } from '@proton/meet/store/slices/currentMeeting';
import { selectIsLocalParticipantAdminOrHost } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectTotalParticipantCount } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest, selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import {
    getHiddenParticipantWarningTitle,
    useHiddenParticipantWarningCount,
} from '../hooks/useHiddenParticipantWarning';

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
    const hiddenParticipantCount = useHiddenParticipantWarningCount();

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
    const isHiddenParticipantWarningShown = hiddenParticipantCount > 0;

    const getIndicatorDescription = () => {
        if (!isHiddenParticipantWarningShown) {
            return getCapacityLabel(capacityStatus);
        }

        const hiddenParticipantTitle = getHiddenParticipantWarningTitle(hiddenParticipantCount);

        switch (capacityStatus) {
            case 'warning':
                // translator: read by screen readers on the participants button, the variable is the hidden participant warning, e.g. "3 people have access but aren't in the call"
                return c('Info').t`${hiddenParticipantTitle}. Meeting almost full`;
            case 'danger':
                // translator: read by screen readers on the participants button, the variable is the hidden participant warning, e.g. "3 people have access but aren't in the call"
                return c('Info').t`${hiddenParticipantTitle}. Meeting full`;
            case 'default':
                return hiddenParticipantTitle;
        }
    };

    return {
        totalParticipantCount,
        maxParticipants,
        indicatorContent: isHiddenParticipantWarningShown ? (
            <span className="text-nowrap">
                {totalParticipantCount}
                <span aria-hidden="true">{' !'}</span>
            </span>
        ) : (
            totalParticipantCount.toString()
        ),
        indicatorStatus: isHiddenParticipantWarningShown ? 'warning' : capacityStatus,
        indicatorDescription: getIndicatorDescription(),
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
