import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { setInitialAudioState, setInitialCameraState } from '@proton/meet/store/slices/deviceManagementSlice';
import {
    selectCameras,
    selectInitialAudioState,
    selectInitialCameraState,
    selectMicrophoneState,
    selectSelectedAudioOutputId,
    selectSelectedCameraId,
    selectSelectedMicrophoneId,
    selectSpeakerState,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { setLocalParticipantColorIndex } from '@proton/meet/store/slices/sortedParticipantsSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';
import { APPS } from '@proton/shared/lib/constants';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { getPrivacyPolicyURL, getTermsURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import { DeviceSettings } from '../../components/DeviceSettings/DeviceSettings';
import { JoiningRoomLoader } from '../../components/JoiningRoomLoader';
import { OpenDesktopAppBanner } from '../../components/OpenDesktopAppBanner/OpenDesktopAppBanner';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { PreJoinDetails } from '../../components/PreJoinDetails/PreJoinDetails';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { RECORDING_MAX_AGE_MS, purgeOldRecordings } from '../../hooks/useMeetingRecorder/recordingStorage/purge';
import { LoadingState } from '../../types';
import { getDisplayNameStorageKey } from '../../utils/storage';

import './PrejoinContainer.scss';

interface PrejoinContainerProps {
    handleJoin: (displayName: string) => void;
    loadingState: LoadingState | null;
    isLoading: boolean;
    shareLink: string;
    roomName: string;
    roomId: string;
    instantMeeting: boolean;
    participantsCount: number | null;
    displayName: string;
    setDisplayName: (displayName: string) => void;
    isInstantJoin: boolean;
    userId?: string;
    isPersonalRoom?: boolean;
    isLoadingMeetings?: boolean;
    joiningLoaderHeader?: string;
    joiningLoaderSubtitle?: string;
}

export const PrejoinContainer = ({
    handleJoin,
    loadingState,
    isLoading,
    shareLink,
    roomName,
    roomId,
    instantMeeting = false,
    participantsCount,
    displayName,
    setDisplayName,
    isInstantJoin,
    userId,
    isPersonalRoom = false,
    isLoadingMeetings = false,
    joiningLoaderHeader,
    joiningLoaderSubtitle,
}: PrejoinContainerProps) => {
    const dispatch = useMeetDispatch();
    const isGuest = useMeetSelector(selectIsGuest);

    // check if a custom display name is already stored for the user
    const hasStoredDisplayName = getItem(getDisplayNameStorageKey(isGuest, userId)) != null;

    const cameras = useMeetSelector(selectCameras);
    const microphoneState = useMeetSelector(selectMicrophoneState);
    const speakerState = useMeetSelector(selectSpeakerState);

    const activeCameraDeviceId = useMeetSelector(selectSelectedCameraId);
    const activeMicrophoneDeviceId = useMeetSelector(selectSelectedMicrophoneId);
    const activeAudioOutputDeviceId = useMeetSelector(selectSelectedAudioOutputId);

    const initialCameraState = useMeetSelector(selectInitialCameraState);
    const initialAudioState = useMeetSelector(selectInitialAudioState);

    const { switchActiveDevice } = useMediaManagementContext();

    const participantColorIndex = useRef(Math.floor(6 * Math.random()));

    useEffect(() => {
        dispatch(setLocalParticipantColorIndex(participantColorIndex.current));
    }, [dispatch]);

    useEffect(() => {
        // Purgue old recordings older than RECORDING_MAX_AGE_MS
        void purgeOldRecordings(RECORDING_MAX_AGE_MS);
    }, []);

    const currentSelectedCamera = activeCameraDeviceId || cameras[0]?.deviceId || '';
    const currentSelectedMicrophone = activeMicrophoneDeviceId || microphoneState.systemDefault?.deviceId || '';
    const currentSelectedAudioOutputDevice = activeAudioOutputDeviceId || speakerState.systemDefault?.deviceId || '';

    const handleJoinMeeting = (displayName: string, keepOnDevice: boolean) => {
        const storageKey = getDisplayNameStorageKey(isGuest, userId);

        if (keepOnDevice && displayName.trim()) {
            setItem(storageKey, displayName);
        } else {
            removeItem(storageKey);
        }

        handleJoin(displayName);
    };

    const handleCameraChange = async (camera: SerializableDeviceInfo) => {
        await switchActiveDevice({
            deviceType: 'videoinput',
            deviceId: camera.deviceId,
            isSystemDefaultDevice: false,
        });
    };

    const handleMicrophoneChange = async (microphone: SerializableDeviceInfo, isDefaultDevice: boolean) => {
        await switchActiveDevice({
            deviceType: 'audioinput',
            deviceId: microphone.deviceId,
            isSystemDefaultDevice: isDefaultDevice,
        });
    };

    const handleAudioOutputDeviceChange = async (speaker: SerializableDeviceInfo, isDefaultDevice: boolean) => {
        await switchActiveDevice({
            deviceType: 'audiooutput',
            deviceId: speaker.deviceId,
            isSystemDefaultDevice: isDefaultDevice,
        });
    };

    return (
        <div className="h-full overflow-y-auto relative flex flex-column flex-nowrap">
            <OpenDesktopAppBanner meetingLink={shareLink} />
            {isLoading && <div className="w-full h-full absolute top-0 left-0 z-up" />}
            <div className="w-full meet-container-padding-x shrink-0">
                <PageHeader showAppSwitcher={false} isInstantJoin={isInstantJoin} />
            </div>
            <div className="prejoin-container flex flex-column md:flex-row md:items-center md:justify-center w-full meet-container-padding-x">
                <div
                    className={clsx(
                        'prejoin-container-content w-full md:w-custom xl:w-custom flex flex-column flex-nowrap lg:flex-row gap-2 *:min-size-auto md:items-center px-2 md:px-4',
                        isInstantJoin && 'justify-center'
                    )}
                    style={{ '--md-w-custom': '71rem', '--xl-w-custom': '76rem' }}
                >
                    {!isInstantJoin && (
                        <DeviceSettings
                            isCameraEnabled={initialCameraState}
                            isMicrophoneEnabled={initialAudioState}
                            onCameraToggle={() => dispatch(setInitialCameraState(!initialCameraState))}
                            onMicrophoneToggle={() => dispatch(setInitialAudioState(!initialAudioState))}
                            selectedCameraId={currentSelectedCamera}
                            selectedMicrophoneId={currentSelectedMicrophone}
                            selectedAudioOutputDeviceId={currentSelectedAudioOutputDevice}
                            onCameraChange={handleCameraChange}
                            onMicrophoneChange={handleMicrophoneChange}
                            onAudioOutputDeviceChange={handleAudioOutputDeviceChange}
                            displayName={displayName}
                            colorIndex={participantColorIndex.current}
                            isLoading={isLoading}
                        />
                    )}

                    {isLoading ? (
                        <>
                            {loadingState === LoadingState.JoiningInProgress && (
                                <JoiningRoomLoader
                                    participantCount={participantsCount}
                                    header={joiningLoaderHeader}
                                    subtitle={joiningLoaderSubtitle}
                                />
                            )}
                        </>
                    ) : (
                        <PreJoinDetails
                            roomName={roomName}
                            roomId={roomId}
                            displayName={displayName}
                            keepDisplayName={hasStoredDisplayName}
                            onDisplayNameChange={setDisplayName}
                            onJoinMeeting={handleJoinMeeting}
                            isPersonalRoom={isPersonalRoom}
                            shareLink={shareLink}
                            instantMeeting={instantMeeting}
                            isLoadingMeetings={isLoadingMeetings}
                        />
                    )}
                </div>
            </div>
            <div className="prejoin-footer text-sm color-hint text-center py-3 px-4 shrink-0">
                {(() => {
                    const termsLink = (
                        <Href className="color-hint" key="terms" href={getTermsURL(APPS.PROTONMEET)}>
                            {c('Link').t`terms and conditions`}
                        </Href>
                    );
                    const privacyLink = (
                        <Href className="color-hint" key="privacy" href={getPrivacyPolicyURL(APPS.PROTONMEET)}>
                            {c('Link').t`privacy policy`}
                        </Href>
                    );
                    return c('Info').jt`By joining, you agree to our ${termsLink} and ${privacyLink}.`;
                })()}
            </div>
        </div>
    );
};
