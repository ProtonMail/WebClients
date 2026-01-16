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
}

export const PreJoinDetails = ({
    roomId,
    displayName,
    onDisplayNameChange,
    keepDisplayName,
    onJoinMeeting,
    shareLink,
    instantMeeting,
}: PreJoinDetailsProps) => {
    const notificationManager = useNotifications();
    const [keepDisplayNameOnDevice, setKeepDisplayNameOnDevice] = useState(keepDisplayName);

    const actionLabel = instantMeeting ? c('Action').t`Start meeting` : c('Action').t`Join meeting`;

    const title = instantMeeting ? c('Title').t`Talk confidentially` : c('Title').t`Join meeting`;

    const getSubtitle = () => {
        if (instantMeeting) {
            return c('Info').t`Our end-to-end encrypted meetings protect privacy and empower truly free expression.`;
        }

        return c('Info').t`You've been invited to join a secure meeting. Confirm your name and click below to enter.`;
    };

    const subtitle = getSubtitle();

    return (
        <div
            className="pre-join-details-container flex flex-nowrap flex-column mt-0 gap-2 lg:gap-4 w-full md:w-custom flex-none md:flex-1 lg:flex-none md:justify-center md:items-center"
            style={{ '--md-w-custom': '22.625rem' }}
        >
            <div className="text-semibold text-center hidden md:block text-3xl xl:h2">{title}</div>
            <div className="text-center color-weak hidden md:block">{subtitle}</div>
            <InputFieldStackedGroup classname="mt-2 mb-2 md:mt-4 md:mb-4 w-full">
                {!instantMeeting && (
                    <InputFieldStacked classname="meeting-id-field hidden md:block" isGroupElement>
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
                        >
                            <IcMeetCopy size={4} />
                        </Button>
                    </InputFieldStacked>
                )}

                <InputFieldStacked isGroupElement classname="pre-join-details-name-input-field">
                    <InputFieldTwo
                        label={c('Label').t`Your name`}
                        type="text"
                        unstyled
                        inputClassName="rounded-none"
                        value={displayName}
                        onChange={(e) => onDisplayNameChange(e.target.value)}
                        placeholder={c('Placeholder').t`Type your name`}
                        maxLength={64}
                    />
                </InputFieldStacked>
            </InputFieldStackedGroup>
            <div className="w-full">
                <Checkbox
                    checked={keepDisplayNameOnDevice}
                    onChange={(e) => setKeepDisplayNameOnDevice(e.target.checked)}
                    id="keep-display-name-on-device"
                >
                    {c('Label').t`Remember my name on this device for future meetings`}
                </Checkbox>
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
