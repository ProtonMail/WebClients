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
import { useMeetings } from '@proton/meet/store/hooks/useMeetings';
import { selectMeetingLink } from '@proton/meet/store/slices/meetingInfo';
import { selectIsMeetingHost } from '@proton/meet/store/slices/meetings';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import clsx from '@proton/utils/clsx';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';
import { PreJoinDetailsHeader } from './PreJoinDetailsHeader';
import { WaitingRoomDropdown } from './WaitingRoomDropdown';

import './PreJoinDetails.scss';

type PreJoinDetailsInternalProps = {
    roomId: string;
    displayName: string;
    keepDisplayName: boolean;
    onDisplayNameChange: (displayName: string) => void;
    onJoinMeeting: (displayName: string, keepOnDevice: boolean) => void;
    instantMeeting: boolean;
    meetingsLoading: boolean;
};

type PreJoinDetailsProps = Omit<PreJoinDetailsInternalProps, 'meetingsLoading'>;

export const PreJoinDetailsInternal = ({
    roomId,
    displayName,
    onDisplayNameChange,
    keepDisplayName,
    onJoinMeeting,
    instantMeeting,
    meetingsLoading,
}: PreJoinDetailsInternalProps) => {
    const notificationManager = useNotifications();
    const { viewportWidth } = useActiveBreakpoint();

    const isHost = useMeetSelector((state) => selectIsMeetingHost(state, roomId));
    const meetingLink = useMeetSelector(selectMeetingLink);

    const [keepDisplayNameOnDevice, setKeepDisplayNameOnDevice] = useState(keepDisplayName);

    const actionLabel = instantMeeting ? c('Action').t`Start meeting` : c('Action').t`Join meeting`;

    const NameInput = (
        <InputFieldStacked isGroupElement classname={clsx(!instantMeeting && viewportWidth['<=small'] && 'rounded-xl')}>
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

    const showHostScreen = instantMeeting || isHost;

    return (
        <div
            className="pre-join-details-container flex flex-nowrap flex-column mt-0 gap-2 lg:py-4 lg:gap-4 w-full md:w-custom flex-none md:flex-1 lg:flex-none md:justify-center md:items-center"
            style={{ '--md-w-custom': '25rem' }}
        >
            {!meetingsLoading && (
                <>
                    <PreJoinDetailsHeader roomId={roomId} instantMeeting={instantMeeting} />
                    <div className="flex flex-column gap-2 lg:gap-4 w-full">
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
                                    <InputFieldStacked
                                        classname="meeting-id-field hidden md:block py-4 px-5"
                                        isGroupElement
                                    >
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
                                        <span className="color-weak ml-2">{c('Label')
                                            .t`Remember my name on this device`}</span>
                                    </Checkbox>
                                </div>
                            </>
                        )}
                    </div>

                    {showHostScreen && <WaitingRoomDropdown />}

                    <Button
                        className="primary py-4 px-5 md:py-5 rounded-full"
                        size="large"
                        fullWidth
                        onClick={() => onJoinMeeting(displayName, keepDisplayNameOnDevice)}
                        disabled={displayName.trim() === ''}
                    >
                        {actionLabel}
                    </Button>
                </>
            )}
        </div>
    );
};

const PreJoinDetailsHeaderLoggedIn = (props: PreJoinDetailsProps) => {
    const [, meetingsLoading] = useMeetings();

    return <PreJoinDetailsInternal {...props} meetingsLoading={meetingsLoading} />;
};

export const PreJoinDetails = (props: PreJoinDetailsProps) => {
    const isGuest = useMeetSelector(selectIsGuest);

    return isGuest ? (
        <PreJoinDetailsInternal {...props} meetingsLoading={false} />
    ) : (
        <PreJoinDetailsHeaderLoggedIn {...props} />
    );
};
