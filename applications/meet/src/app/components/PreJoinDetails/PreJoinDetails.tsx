import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Checkbox from '@proton/components/components/input/Checkbox';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcMeetCopy } from '@proton/icons/icons/IcMeetCopy';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectIsPersonalRoom,
    selectMeetingLink,
    selectMeetingPassword,
    selectRoomName,
    setMeetingInfo,
} from '@proton/meet/store/slices/meetingInfo';
import { selectIsMeetingHost } from '@proton/meet/store/slices/meetings';
import clsx from '@proton/utils/clsx';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';
import { useMeetingAuthentication } from '../../hooks/srp/useMeetingAuthentication';
import type { JoinLocationState } from '../../types';
import { getPreloadedMeetingDetails } from '../../utils/meetingDetailsPreload';
import { PreJoinDetailsHeader } from './PreJoinDetailsHeader';
import { WaitingRoomDropdown } from './WaitingRoomDropdown';

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

    const dispatch = useMeetDispatch();

    const { getMeetingDetails, initHandshake } = useMeetingAuthentication();

    const { state: joinState } = useLocation<JoinLocationState | undefined>();

    // Meeting details coming from react router location state.
    const meetingDetails = joinState?.meetingDetails;

    const [isMeetingLoading, setIsMeetingLoading] = useState(!instantMeeting && !meetingDetails);
    const meetingName = useMeetSelector(selectRoomName);
    const isPersonalRoom = useMeetSelector(selectIsPersonalRoom);
    const meetingPassword = useMeetSelector(selectMeetingPassword);

    useEffect(() => {
        if (instantMeeting) {
            return;
        }

        if (meetingDetails) {
            dispatch(
                setMeetingInfo({
                    meetingName: meetingDetails.meetingName,
                    isPersonalRoom: !!meetingDetails.isPersonalRoom,
                })
            );

            return;
        }

        const fetchFromApi = async () => {
            const handshakeInfo = await initHandshake(roomId);
            return getMeetingDetails({
                urlPassword: meetingPassword,
                token: roomId,
                handshakeInfo,
            });
        };

        const fetchMeetingDetails = async () => {
            try {
                const preloaded = await getPreloadedMeetingDetails(roomId)?.catch(() => undefined);

                const { roomName, isPersonalRoom } = preloaded ?? (await fetchFromApi());

                dispatch(setMeetingInfo({ meetingName: roomName, isPersonalRoom }));
            } finally {
                setIsMeetingLoading(false);
            }
        };

        if (meetingPassword) {
            void fetchMeetingDetails();
        } else {
            setIsMeetingLoading(false);
        }
    }, [dispatch, getMeetingDetails, initHandshake, instantMeeting, meetingDetails, meetingPassword, roomId]);

    const isHost = useMeetSelector((state) => selectIsMeetingHost(state, roomId));
    const meetingLink = useMeetSelector(selectMeetingLink);

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

    return (
        <div
            className="pre-join-details-container flex flex-nowrap flex-column mt-0 gap-2 lg:py-4 lg:gap-4 w-full md:w-custom flex-none md:flex-1 lg:flex-none md:justify-center items-center"
            style={{ '--md-w-custom': '25rem' }}
        >
            {!isMeetingLoading ? (
                <>
                    <PreJoinDetailsHeader
                        meetingName={meetingName}
                        isPersonalRoom={isPersonalRoom}
                        instantMeeting={instantMeeting}
                    />
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
            ) : (
                <div className="flex flex-column items-center justify-center gap-2 pt-10 lg:pt-0">
                    <CircleLoader
                        aria-hidden="true"
                        className="color-primary w-custom h-custom"
                        style={{ '--w-custom': '5.3rem', '--h-custom': '5.3rem', '--stroke-width': 1.3 }}
                    />
                    <span className="text-rg color-weak">{c('Info').t`Loading meeting details...`}</span>
                </div>
            )}
        </div>
    );
};
