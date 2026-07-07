import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SettingsLink, Toggle } from '@proton/components/index';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { PLANS } from '@proton/payments/core/constants';

import './ScheduleMeetingOptions.scss';

const WaitingRoomCard = () => {
    const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(false);
    const { isPaidUser, hasSubscriptionWithoutMeet } = useMeetSelector(selectSubscriptionStatus);

    const getDescription = () => {
        if (!isPaidUser) {
            return (
                <>
                    {c('Action').t`Use waiting room with a paid plan`}
                    <SettingsLink
                        className="w-full upgrade-now mx-2"
                        path={
                            hasSubscriptionWithoutMeet
                                ? `/dashboard?addon=meet`
                                : `/dashboard?plan=${PLANS.MEET_BUSINESS}`
                        }
                        target={'_blank'}
                    >
                        {c('Action').t`Upgrade now`}
                        <span className="sr-only">{c('Accessibility').t`(opens in new tab)`}</span>
                    </SettingsLink>
                </>
            );
        }

        return isWaitingRoomEnabled
            ? c('Action').t`Participants join after you approve them`
            : c('Action').t`Anyone with the link can join immediately`;
    };

    return (
        <div className="schedule-meeting-options flex flex-nowrap flex-1 items-center gap-4 px-6 py-4 rounded-xl">
            <div className="flex flex-column flex-1">
                <label className="color-norm" htmlFor="waiting-room">
                    {c('Action').t`Waiting room`}
                </label>
                <span className="setting-description color-weak">{getDescription()}</span>
            </div>
            <Toggle
                id="waiting-room"
                checked={isWaitingRoomEnabled}
                onChange={() => {
                    if (!isPaidUser) {
                        return;
                    }

                    setIsWaitingRoomEnabled(!isWaitingRoomEnabled);
                }}
                disabled={!isPaidUser}
            />
        </div>
    );
};

export const ScheduleMeetingOptions = () => {
    const [showOptions, setShowOptions] = useState(false);
    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);

    return (
        <>
            <div className="w-full flex flex-nowrap items-center justify-end gap-2">
                <Button
                    className="color-primary ml-auto rounded-full timezone-button"
                    shape="ghost"
                    onClick={() => setShowOptions(!showOptions)}
                >
                    {showOptions ? c('Action').t`Hide options` : c('Action').t`Show options`}
                </Button>
            </div>
            {showOptions && (
                <div className="w-full flex flex-nowrap items-center gap-4">
                    <IcHourglass
                        size={5}
                        style={{ color: isPaidUser ? 'var(--interaction-weak-major-3)' : '#FEAE8A' }}
                    />
                    <WaitingRoomCard />
                </div>
            )}
        </>
    );
};
