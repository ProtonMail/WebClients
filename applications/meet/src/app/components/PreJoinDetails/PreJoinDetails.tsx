import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcMeetCopy } from '@proton/icons/icons/IcMeetCopy';

import './PreJoinDetails.scss';

interface PreJoinDetailsProps {
    roomName: string;
    roomId: string;
    displayName: string;
    keepDisplayName: boolean;
    onDisplayNameChange: (displayName: string) => void;
    onJoinMeeting: (displayName: string, keepOnDevice: boolean) => void;
    shareLink: string;
    instantMeeting: boolean;
    isPersonalRoom?: boolean;
    isLoadingMeetings?: boolean;
}

export const PreJoinDetails = ({
    roomId,
    displayName,
    onDisplayNameChange,
    keepDisplayName,
    onJoinMeeting,
    shareLink,
    instantMeeting,
    isPersonalRoom = false,
    isLoadingMeetings = false,
}: PreJoinDetailsProps) => {
    const notificationManager = useNotifications();

    const [keepDisplayNameOnDevice, setKeepDisplayNameOnDevice] = useState(keepDisplayName);

    const actionLabel = instantMeeting ? c('Action').t`Start meeting` : c('Action').t`Join meeting`;

    const getTitle = () => {
        if (isPersonalRoom) {
            return c('Title').t`Personal meeting room`;
        }
        if (instantMeeting) {
            return c('Title').t`Talk confidentially`;
        }
        return c('Title').t`Join meeting`;
    };

    const getSubtitle = () => {
        if (isPersonalRoom) {
            return c('Info').t`Your always available meeting room`;
        }
        if (instantMeeting) {
            return c('Info').t`Our end-to-end encrypted meetings protect privacy and empower truly free expression.`;
        }
        return c('Info').t`You've been invited to join a secure meeting. Confirm your name and click below to enter.`;
    };

    const title = getTitle();
    const subtitle = getSubtitle();

    return (
        <div
            className="pre-join-details-container flex flex-nowrap flex-column mt-0 gap-2 lg:py-4 lg:gap-4 w-full md:w-custom flex-none md:flex-1 lg:flex-none md:justify-center md:items-center"
            style={{ '--md-w-custom': '25rem' }}
        >
            <div className="flex flex-column gap-2">
                {!isLoadingMeetings && (
                    <>
                        <div
                            className={`title text-semibold text-center hidden md:block ${isPersonalRoom ? 'color-primary' : ''}`}
                        >
                            {title}
                        </div>
                        <div className="text-center color-weak hidden md:block">{subtitle}</div>
                    </>
                )}
            </div>
            <div className="flex flex-column gap-2 lg:gap-4 py-2 lg:py-4 w-full">
                <InputFieldStackedGroup classname="w-full">
                    {!instantMeeting && (
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
                                    void navigator.clipboard.writeText(shareLink);
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
                    )}

                    <InputFieldStacked isGroupElement classname="pre-join-details-name-input-field">
                        <InputFieldTwo
                            label={c('Label').t`Name`}
                            type="text"
                            unstyled
                            inputClassName="rounded-none"
                            value={displayName}
                            onChange={(e) => onDisplayNameChange(e.target.value)}
                            placeholder={c('Placeholder').t`Enter your name`}
                            maxLength={64}
                        />
                    </InputFieldStacked>
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
            </div>
            <Button
                className="join-button py-4 px-5 md:py-5 rounded-full color-invert"
                color="norm"
                size="large"
                fullWidth
                onClick={() => onJoinMeeting(displayName, keepDisplayNameOnDevice)}
                disabled={displayName.trim() === ''}
            >
                {actionLabel}
            </Button>
        </div>
    );
};
