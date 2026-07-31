import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcMeetCopy } from '@proton/icons/icons/IcMeetCopy';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectCanManageWaitingRoom,
    selectIsMeetingLoading,
    selectIsPersonalRoom,
    selectMeetingLink,
    selectRoomName,
} from '@proton/meet/store/slices/meetingInfo';
import { selectIsWaitingRoomAdmissionActive } from '@proton/meet/store/slices/waitingRoomSlice';
import clsx from '@proton/utils/clsx';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';
import { PreJoinDetailsHeader } from './PreJoinDetailsHeader';
import { WaitingRoomAdmission } from './WaitingRoomAdmission/WaitingRoomAdmission';
import { WaitingRoomDropdown } from './WaitingRoomDropdown';
import { PreJoinDetailsShell } from './shared/PreJoinDetailsShell';

import './PreJoinDetails.scss';

type PreJoinDetailsProps = {
    roomId: string;
    displayName: string;
    keepDisplayName: boolean;
    onDisplayNameChange: (displayName: string) => void;
    onJoinMeeting: (displayName: string, keepOnDevice: boolean) => void;
    instantMeeting: boolean;
};

export const PreJoinDetails = ({
    roomId,
    displayName,
    onDisplayNameChange,
    keepDisplayName,
    onJoinMeeting,
    instantMeeting,
}: PreJoinDetailsProps) => {
    const notificationManager = useNotifications();
    const { viewportWidth } = useActiveBreakpoint();

    const isMeetingLoading = useMeetSelector(selectIsMeetingLoading);
    const meetingName = useMeetSelector(selectRoomName);
    const isPersonalRoom = useMeetSelector(selectIsPersonalRoom);
    const isHost = useMeetSelector(selectCanManageWaitingRoom);
    const meetingLink = useMeetSelector(selectMeetingLink);
    const showWaitingRoomAdmission = useMeetSelector(selectIsWaitingRoomAdmissionActive);

    const [keepDisplayNameOnDevice, setKeepDisplayNameOnDevice] = useState(keepDisplayName);

    const actionLabel = instantMeeting ? c('Action').t`Start meeting` : c('Action').t`Join meeting`;

    const showHostScreen = instantMeeting || isHost;

    const NameInput = (
        <InputFieldStacked isGroupElement classname={clsx(!showHostScreen && viewportWidth['<=small'] && 'rounded-xl')}>
            <InputFieldTwo
                label={c('Label').t`Name`}
                type="text"
                unstyled
                inputClassName="rounded-none"
                value={displayName}
                onChange={(e) => onDisplayNameChange(e.target.value)}
                placeholder={c('Placeholder').t`Enter your name`}
                maxLength={64}
                autoFocus={true}
            />
        </InputFieldStacked>
    );

    if (showWaitingRoomAdmission) {
        return <WaitingRoomAdmission />;
    }

    return (
        <PreJoinDetailsShell
            header={
                <PreJoinDetailsHeader
                    meetingName={meetingName}
                    isPersonalRoom={isPersonalRoom}
                    instantMeeting={instantMeeting}
                />
            }
            actions={[
                ...(showHostScreen
                    ? [<WaitingRoomDropdown instantMeeting={instantMeeting} key="waiting-room-dropdown" />]
                    : []),
                <Button
                    key="join-meeting"
                    className="primary py-4 px-5 md:py-5 rounded-full"
                    size="large"
                    fullWidth
                    onClick={() => onJoinMeeting(displayName, keepDisplayNameOnDevice)}
                    disabled={displayName.trim() === ''}
                >
                    {actionLabel}
                </Button>,
            ]}
            loading={isMeetingLoading}
        >
            {showHostScreen ? (
                <InputFieldStackedGroup classname="w-full">
                    {NameInput}
                    <InputFieldStacked isGroupElement>
                        <SettingToggle
                            id="keep-display-name-on-device"
                            label={c('Label').t`Save my name on this device`}
                            ariaLabel={c('Alt').t`Save my name on this device`}
                            checked={keepDisplayNameOnDevice}
                            onChange={(e) => setKeepDisplayNameOnDevice(e.target.checked)}
                            size="medium"
                            className="remember-my-name-on-this-device"
                        />
                    </InputFieldStacked>
                </InputFieldStackedGroup>
            ) : (
                <>
                    <InputFieldStackedGroup classname="w-full">
                        <InputFieldStacked classname="meeting-id-field hidden md:block py-4 px-5" isGroupElement>
                            <InputFieldTwo
                                label={c('Label').t`Meeting ID`}
                                type="text"
                                unstyled
                                inputClassName="rounded-none"
                                value={roomId || c('Placeholder').t`Loading...`}
                                onChange={(e) => e.preventDefault()}
                                readOnly
                                tabIndex={-1}
                            />
                            <Button
                                className="copy-button absolute top-custom right-custom w-custom h-custom rounded-full flex items-center justify-center border-none p-0"
                                style={{
                                    '--top-custom': '50%',
                                    '--right-custom': '1rem',
                                    '--w-custom': '2.5rem',
                                    '--h-custom': '2.5rem',
                                    transform: 'translateY(-50%)',
                                }}
                                onClick={() => {
                                    void navigator.clipboard.writeText(meetingLink);
                                    notificationManager.createNotification({
                                        type: 'info',
                                        text: c('Notification').t`Copied to clipboard`,
                                        showCloseButton: false,
                                    });
                                }}
                                aria-label={c('Alt').t`Copy meeting link`}
                                color="weak"
                            >
                                <IcMeetCopy size={4} alt={c('Action').t`Copy meeting link`} />
                            </Button>
                        </InputFieldStacked>
                        {NameInput}
                    </InputFieldStackedGroup>
                    <div className="w-full py-1">
                        <Checkbox
                            checked={keepDisplayNameOnDevice}
                            onChange={(e) => setKeepDisplayNameOnDevice(e.target.checked)}
                            id="keep-display-name-on-device"
                        >
                            <span className="color-weak ml-2">{c('Label').t`Remember my name on this device`}</span>
                        </Checkbox>
                    </div>
                </>
            )}
        </PreJoinDetailsShell>
    );
};
