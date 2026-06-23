import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton } from '@proton/components/index';
import { IcMeetSettings } from '@proton/icons/icons/IcMeetSettings';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectHasRecordings, setRecordings } from '@proton/meet/store/slices/recordingsSlice';
import { selectUserId } from '@proton/meet/store/slices/userSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { useIsRecordingSupported } from '../../hooks/useMeetingRecorder/hooks/useIsRecordingSupported';
import {
    listAllOpfsRecordings,
    listOpfsRecordings,
} from '../../hooks/useMeetingRecorder/recordingStorage/recordingFiles';

export const SettingsDropdown = () => {
    const isRecordingRecoveryUIEnabled = useFlag('MeetRecordingRecoveryUI');
    const showAllRecordings = useFlag('MeetRecordingShowAllRecordings');

    const dispatch = useMeetDispatch();

    const isRecordingSupported = useIsRecordingSupported();
    const userId = useMeetSelector(selectUserId);
    const hasRecordings = useMeetSelector(selectHasRecordings);

    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);

    const history = useHistory();

    useEffect(() => {
        if (!isRecordingRecoveryUIEnabled) {
            return;
        }

        const load = async () => {
            dispatch(
                setRecordings(showAllRecordings ? await listAllOpfsRecordings() : await listOpfsRecordings(userId))
            );
        };

        void load();
    }, [dispatch, isRecordingRecoveryUIEnabled, showAllRecordings, userId]);

    if (!isRecordingSupported || !isRecordingRecoveryUIEnabled || !hasRecordings) {
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
