import { useState } from 'react';

import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownCaret from '@proton/components/components/dropdown/DropdownCaret';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { useFlag } from '@proton/unleash/useFlag';

import { ExpandOptionsButton } from '../../atoms/ExpandOptionsButton/ExpandOptionsButton';
import { OptionButton } from '../../atoms/OptionButton/OptionButton';

import './WaitingRoomDropdown.scss';

export const WaitingRoomDropdown = () => {
    const isMeetWaitingRoomEnabled = useFlag('MeetWaitingRoom');

    const [waitingRoomStatus, setWaitingRoomStatus] = useState<boolean>(true);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    if (!isMeetWaitingRoomEnabled) {
        return null;
    }

    return (
        <>
            <ExpandOptionsButton ref={anchorRef} onClick={toggle}>
                {waitingRoomStatus ? c('Action').t`Waiting room enabled` : c('Action').t`Waiting room disabled`}
                <DropdownCaret className="shrink-0 ml-1" isOpen={isOpen} />
            </ExpandOptionsButton>
            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                size={{ width: '25rem', maxWidth: '25rem' }}
                className="waiting-room-dropdown rounded-xl"
                originalPlacement="bottom-end"
            >
                <OptionButton
                    iconOnTheRight
                    showIcon={waitingRoomStatus}
                    Icon={IcCheckmark}
                    label={c('Label').t`Enabled`}
                    description={c('Label').t`Participants join after you approve them`}
                    onClick={() => setWaitingRoomStatus(true)}
                />
                <OptionButton
                    iconOnTheRight
                    showIcon={!waitingRoomStatus}
                    Icon={IcCheckmark}
                    label={c('Label').t`Disabled`}
                    description={c('Label').t`Anyone with the link can join`}
                    onClick={() => setWaitingRoomStatus(false)}
                />
            </Dropdown>
        </>
    );
};
