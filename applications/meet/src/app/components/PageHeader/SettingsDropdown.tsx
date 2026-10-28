import { useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcMeetSettings } from '@proton/icons/icons/IcMeetSettings';
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
                className="button-for-icon settings-button settings-button-icon"
            >
                <IcMeetSettings size={5} color="var(--icon-color)" />
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
