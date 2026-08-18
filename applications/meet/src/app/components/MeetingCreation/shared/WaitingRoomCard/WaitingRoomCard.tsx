import { c } from 'ttag';

import { SettingsLink } from '@proton/components/index';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { PLANS } from '@proton/payments/core/constants';
import { WaitingRoomState } from '@proton/shared/lib/interfaces/Meet';
import clsx from '@proton/utils/clsx';

import { SettingToggle } from '../../../../atoms/SettingToggle/SettingToggle';

import './WaitingRoomCard.scss';

export type WaitingRoomChange = (value: WaitingRoomState) => void;

export const WaitingRoomCard = ({
    waitingRoom,
    onWaitingRoomChange,
}: {
    waitingRoom: WaitingRoomState;
    onWaitingRoomChange: WaitingRoomChange;
}) => {
    const { isPaidUser, hasSubscriptionWithoutMeet } = useMeetSelector(selectSubscriptionStatus);

    const isWaitingRoomEnabled = waitingRoom === WaitingRoomState.ENABLED;

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
        <div className="w-full flex flex-nowrap items-center gap-4">
            <IcHourglass size={5} style={{ color: isPaidUser ? 'var(--interaction-weak-major-3)' : '#FEAE8A' }} />
            <div
                className={clsx(
                    'waiting-room-card flex flex-nowrap flex-1 items-center gap-4 px-6 py-4 rounded-xl',
                    !isPaidUser && 'waiting-room-card-upsell'
                )}
            >
                <SettingToggle
                    id="waiting-room"
                    ariaLabel={c('Alt').t`Waiting room`}
                    label={c('Action').t`Waiting room`}
                    description={getDescription()}
                    checked={isWaitingRoomEnabled}
                    size="medium"
                    changeLabelColor={false}
                    disabled={!isPaidUser}
                    onChange={() => {
                        if (!isPaidUser) {
                            return;
                        }

                        onWaitingRoomChange(
                            isWaitingRoomEnabled ? WaitingRoomState.DISABLED : WaitingRoomState.ENABLED
                        );
                    }}
                />
            </div>
        </div>
    );
};
