import { useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton, Icon } from '@proton/components/index';
import { useFlag } from '@proton/unleash/useFlag';

import { useIsRecordingSupported } from '../../hooks/useMeetingRecorder/hooks/useIsRecordingSupported';

export const SettingsDropdown = () => {
    const isRecordingRecoveryUIEnabled = useFlag('MeetRecordingRecoveryUI');
    const isRecordingSupported = useIsRecordingSupported();

    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);

    const history = useHistory();

    if (!isRecordingSupported || !isRecordingRecoveryUIEnabled) {
        return null;
    }

    const toggle = () => {
        setIsOpen(!isOpen);
    };

    const close = () => {
        setIsOpen(false);
    };

    const goToManageRecordings = () => {
        history.push('/manage-recordings');
    };

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                shape="ghost"
                className="button-for-icon button-pill"
            >
                <Icon name={'meet-settings'} color="var(--icon-color)" />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton className="text-left" onClick={goToManageRecordings}>
                        {c('Label').t`Manage recordings`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
