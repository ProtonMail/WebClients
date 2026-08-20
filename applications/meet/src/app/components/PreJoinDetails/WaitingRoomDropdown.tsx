import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownCaret from '@proton/components/components/dropdown/DropdownCaret';
import { useSettingsLink } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { useIsWaitingRoomCreationEnabled } from '@proton/meet/hooks/useWaitingRoomFlags';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectWaitingRoomSetting, setWaitingRoomSetting } from '@proton/meet/store/slices/settings';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { PLANS } from '@proton/payments/core/constants';

import { ExpandOptionsButton } from '../../atoms/ExpandOptionsButton/ExpandOptionsButton';
import { useNewPill } from '../../atoms/NewPill/useNewPill';
import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { useWaitingRoomContext } from '../../contexts/WaitingRoomContext';

import './WaitingRoomDropdown.scss';

export const WaitingRoomDropdown = ({ instantMeeting }: { instantMeeting: boolean }) => {
    const isWaitingRoomCreationEnabled = useIsWaitingRoomCreationEnabled();
    const dispatch = useMeetDispatch();
    const waitingRoomSetting = useMeetSelector(selectWaitingRoomSetting);
    const [loading, withLoading] = useLoading();
    const { isPaidUser, hasSubscriptionWithoutMeet } = useMeetSelector(selectSubscriptionStatus);
    const goToSettings = useSettingsLink();

    const { toggleWaitingRoomPrejoin } = useWaitingRoomContext();

    const handleWaitingRoomSettingToggle = async (value: boolean) => {
        if (!isPaidUser) {
            return;
        }

        if (!instantMeeting) {
            await withLoading(toggleWaitingRoomPrejoin(value));
        } else {
            dispatch(setWaitingRoomSetting(value));
        }
    };

    const handleEnableWaitingRoomClick = () => {
        if (!isPaidUser) {
            return goToSettings(
                hasSubscriptionWithoutMeet ? '/dashboard?addon=meet' : `/dashboard?plan=${PLANS.MEET_BUSINESS}`,
                undefined,
                true
            );
        }

        return handleWaitingRoomSettingToggle(true);
    };

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { isNew, markNewPillAsRead } = useNewPill('waiting-room-dropdown');

    if (!isWaitingRoomCreationEnabled) {
        return null;
    }

    return (
        <>
            <ExpandOptionsButton
                ref={anchorRef}
                onClick={() => {
                    toggle();
                    markNewPillAsRead();
                }}
                newPill={isNew}
            >
                {waitingRoomSetting ? c('Action').t`Waiting room enabled` : c('Action').t`Waiting room disabled`}
                <DropdownCaret className="shrink-0 ml-1" isOpen={isOpen} />
            </ExpandOptionsButton>
            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                size={{ width: '25rem', maxWidth: '25rem' }}
                className="waiting-room-dropdown meet-radius meet-dropdown"
                originalPlacement="bottom-end"
            >
                <div className="flex flex-column m-2">
                    <OptionButton
                        iconOnTheRight
                        showIcon={waitingRoomSetting}
                        Icon={IcCheckmark}
                        label={c('Label').t`Enabled`}
                        description={
                            isPaidUser
                                ? c('Label').t`Participants join after you approve them`
                                : c('Label').t`Use waiting room with a paid plan`
                        }
                        onClick={handleEnableWaitingRoomClick}
                        loading={loading}
                        rightContent={
                            !isPaidUser && (
                                <span className="action-button shrink-0 border rounded-full px-4 py-1.5">
                                    <span className="upgrade-now">{c('Action').t`Upgrade`}</span>
                                    <span className="sr-only">{c('Accessibility').t`(opens in new tab)`}</span>
                                </span>
                            )
                        }
                    />
                    <OptionButton
                        iconOnTheRight
                        showIcon={!waitingRoomSetting}
                        Icon={IcCheckmark}
                        label={c('Label').t`Disabled`}
                        description={c('Label').t`Anyone with the link can join`}
                        onClick={() => handleWaitingRoomSettingToggle(false)}
                        loading={loading}
                    />
                </div>
            </Dropdown>
        </>
    );
};
