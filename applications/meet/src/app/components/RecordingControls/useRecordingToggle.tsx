import { useState } from 'react';

import { addSeconds, format, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useSettingsLink } from '@proton/components';
import { IcArrowDownCircle } from '@proton/icons/icons/IcArrowDownCircle';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectIsGuestAdmin,
    selectIsLocalParticipantAdminOrHost,
} from '@proton/meet/store/slices/participants/participantsSlice';
import {
    selectIsLocalParticipantRecording,
    selectLocalRecordingTime,
} from '@proton/meet/store/slices/recordingStatusSlice';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { PLANS } from '@proton/payments/core/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { dateLocale } from '@proton/shared/lib/i18n';
import IcCircleRadioFilled from '@proton/styles/assets/img/meet/ic-circle-radio-filled.svg';

import { useMeetingRecorderContext } from '../../contexts/MeetingRecorderContext';
import { useIsRecordingSupported } from '../../hooks/useMeetingRecorder/hooks/useIsRecordingSupported';
import { ScreenRecordingUpsell } from '../AnonymousModal/feature-upsell/ScreenRecordingUpsell';
import { SubUserScreenRecordingUpsell } from '../AnonymousModal/feature-upsell/SubUserScreenRecordingUpsell';
import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';
import { RecordingDownloadModal } from './RecordingDownloadModal/RecordingDownloadModal';

const formatDuration = (seconds: number) => {
    const pattern = seconds >= 3600 ? 'HH:mm:ss' : 'mm:ss';
    return format(addSeconds(startOfDay(new Date()), seconds), pattern, { locale: dateLocale });
};

export const useRecordingToggle = () => {
    const { startRecording, finishRecording } = useMeetingRecorderContext();
    const { createNotification } = useNotifications();
    const goToSettings = useSettingsLink();

    const duration = useMeetSelector(selectLocalRecordingTime);
    const isLocalRecording = useMeetSelector(selectIsLocalParticipantRecording);
    const isLocalParticipantAdminOrHost = useMeetSelector(selectIsLocalParticipantAdminOrHost);
    const { isPaidUser, isSubUser } = useMeetSelector(selectSubscriptionStatus);
    const isGuestAdmin = useMeetSelector(selectIsGuestAdmin);
    const isRecordingSupported = useIsRecordingSupported();

    const [showStartRecordingConfirmation, setShowStartRecordingConfirmation] = useState(false);
    const [showStopRecordingConfirmation, setShowStopRecordingConfirmation] = useState(false);
    const [showRecordingUpsellModal, setShowRecordingUpsellModal] = useState(false);
    const [showSubUserRecordingUpsellModal, setShowSubUserRecordingUpsellModal] = useState(false);

    const hasAdminPermission = isLocalParticipantAdminOrHost || isGuestAdmin;
    // Firefox keeps a disabled toggle to explain why recording is unavailable.
    const isVisible = hasAdminPermission && (isRecordingSupported || isFirefox());
    const canRecord = hasAdminPermission && isRecordingSupported && isPaidUser;

    const handleStartRecording = async () => {
        setShowStartRecordingConfirmation(false);
        try {
            await startRecording();
        } catch (error) {
            createNotification({
                text: c('Error').t`Failed to start recording`,
                type: 'error',
            });
        }
    };

    const handleStopRecording = async () => {
        setShowStopRecordingConfirmation(false);
        await finishRecording();
    };

    const onChange = () => {
        if (isLocalRecording) {
            setShowStopRecordingConfirmation(true);
            return;
        }

        if (isPaidUser) {
            setShowStartRecordingConfirmation(true);
            return;
        }

        // Sub users can't upgrade, so we show a modal instead.
        if (isSubUser) {
            setShowSubUserRecordingUpsellModal(true);
            return;
        }

        setShowRecordingUpsellModal(true);
    };

    const modals = (
        <>
            {showStartRecordingConfirmation && (
                <ConfirmationModal
                    icon={
                        <img
                            src={IcCircleRadioFilled}
                            alt=""
                            className="w-custom h-custom"
                            style={{ '--w-custom': '4.5em', '--h-custom': '4.5em' }}
                        />
                    }
                    title={c('Title').t`Record this meeting`}
                    message={c('Info').t`Recording will begin and attendees will be notified.`}
                    primaryText={c('Action').t`Start recording`}
                    primaryButtonClass="primary"
                    onPrimaryAction={handleStartRecording}
                    onSecondaryAction={() => setShowStartRecordingConfirmation(false)}
                    onClose={() => setShowStartRecordingConfirmation(false)}
                />
            )}
            {showStopRecordingConfirmation && (
                <ConfirmationModal
                    icon={<IcArrowDownCircle size={15} />}
                    title={c('Title').t`Stop recording`}
                    message={c('Info').t`Are you sure you want to stop recording?`}
                    primaryText={c('Action').t`Stop recording and download video`}
                    primaryButtonClass="primary"
                    onPrimaryAction={handleStopRecording}
                    onSecondaryAction={() => setShowStopRecordingConfirmation(false)}
                    onClose={() => setShowStopRecordingConfirmation(false)}
                />
            )}
            {showRecordingUpsellModal && (
                <ScreenRecordingUpsell
                    open={showRecordingUpsellModal}
                    onClose={() => setShowRecordingUpsellModal(false)}
                    action={() => {
                        goToSettings(`/dashboard?plan=${PLANS.MEET_BUSINESS}`, undefined, true);
                    }}
                />
            )}
            {showSubUserRecordingUpsellModal && (
                <SubUserScreenRecordingUpsell
                    open={showSubUserRecordingUpsellModal}
                    onClose={() => setShowSubUserRecordingUpsellModal(false)}
                    action={() => setShowSubUserRecordingUpsellModal(false)}
                />
            )}
            {canRecord && <RecordingDownloadModal />}
        </>
    );

    return {
        isVisible,
        checked: isLocalRecording,
        disabled: !isRecordingSupported,
        tooltip: isRecordingSupported ? undefined : c('Info').t`Meeting recordings aren’t supported in Firefox.`,
        duration: formatDuration(duration),
        onChange,
        onStop: () => setShowStopRecordingConfirmation(true),
        modals,
    };
};
