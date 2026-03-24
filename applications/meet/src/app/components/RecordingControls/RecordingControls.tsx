import { useRef, useState } from 'react';

import { addSeconds, format, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useNotifications, useSettingsLink } from '@proton/components';
import { IcMeetRecord } from '@proton/icons/icons/IcMeetRecord';
import { IcMeetRecordStop } from '@proton/icons/icons/IcMeetRecordStop';
import { PLANS } from '@proton/payments/core/constants';
import { isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import { dateLocale } from '@proton/shared/lib/i18n';
import IcCircleRadioFilled from '@proton/styles/assets/img/meet/ic-circle-radio-filled.svg';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useGuestContext } from '../../contexts/GuestProvider/GuestContext';
import { useMeetingRecorderContext } from '../../contexts/MeetingRecorderContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { useIsTreatedAsPaidMeetUser } from '../../hooks/useIsTreatedAsPaidMeetUser';
import { ScreenRecordingUpsell } from '../AnonymousModal/feature-upsell/ScreenRecordingUpsell';
import { SubUserScreenRecordingUpsell } from '../AnonymousModal/feature-upsell/SubUserScreenRecordingUpsell';
import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

import './RecordingControls.scss';

const RecordingControlsInternal = () => {
    const isMeetingRecordingEnabled = useFlag('MeetingRecording');
    const { startRecording, downloadRecording, recordingState } = useMeetingRecorderContext();
    const { createNotification } = useNotifications();

    const durationIntervalRef = useRef<number>();
    const isLargerThanMd = useIsLargerThanMd();

    const [duration, setDuration] = useState(0);

    const goToSettings = useSettingsLink();
    const [showStartRecordingConfirmation, setShowStartRecordingConfirmation] = useState(false);
    const [showRecordingUpsellModal, setShowRecordingUpsellModal] = useState(false);
    const [showSubUserRecordingUpsellModal, setShowSubUserRecordingUpsellModal] = useState(false);

    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();
    const { isPaid, isSubUser } = useIsTreatedAsPaidMeetUser();

    const recordingNotSupported = isMobile() || isFirefox();

    const hasAdminPermission = isLocalParticipantAdmin || isLocalParticipantHost;

    const shouldDisplayRecordingControls = hasAdminPermission && isMeetingRecordingEnabled;

    const handleStartRecording = async () => {
        setShowStartRecordingConfirmation(false);
        try {
            await startRecording();
            durationIntervalRef.current = window.setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            createNotification({
                text: c('Error').t`Failed to start recording`,
                type: 'error',
            });
        }
    };

    const handleStopAndDownload = async () => {
        try {
            await downloadRecording();
            createNotification({
                text: c('Info').t`Recording saved`,
                type: 'success',
            });
            clearInterval(durationIntervalRef.current);
            setDuration(0);
        } catch (error) {
            createNotification({
                text: c('Error').t`Failed to save recording`,
                type: 'error',
            });
        }
    };

    const handleStartRecordingConfirmation = () => {
        if (isPaid) {
            setShowStartRecordingConfirmation(true);
            return;
        }

        if (isSubUser) {
            setShowSubUserRecordingUpsellModal(true);
            return;
        }

        setShowRecordingUpsellModal(true);
    };

    const formatDuration = (seconds: number) => {
        const pattern = seconds >= 3600 ? 'HH:mm:ss' : 'mm:ss';
        return format(addSeconds(startOfDay(new Date()), seconds), pattern, { locale: dateLocale });
    };

    if (!shouldDisplayRecordingControls || recordingNotSupported) {
        return null;
    }

    return (
        <>
            <div className="recording-controls flex items-center gap-2">
                {!recordingState.isRecording ? (
                    <CircleButton
                        IconComponent={IcMeetRecord}
                        onClick={handleStartRecordingConfirmation}
                        ariaLabel={c('Action').t`Start recording`}
                        size={6}
                        tooltipTitle={c('Info').t`Start recording`}
                    />
                ) : (
                    <Button
                        className={clsx(
                            isLargerThanMd ? 'px-5 py-4' : 'px-4 py-3',
                            'stop-recording-button border-none shrink-0 min-w-custom'
                        )}
                        pill={true}
                        size="large"
                        onClick={handleStopAndDownload}
                        aria-label={c('Alt').t`Stop recording and download.`}
                        style={{ '--min-w-custom': '16.5rem' }}
                    >
                        <div className="w-full flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap">
                            <IcMeetRecordStop className="shrink-0" size={6} />
                            <span>{c('Action').t`Stop recording`}</span>
                            <span
                                className="inline-block text-center"
                                style={{ minWidth: '3.5rem', fontVariantNumeric: 'tabular-nums' }}
                            >
                                {formatDuration(duration)}
                            </span>
                        </div>
                    </Button>
                )}
            </div>
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
        </>
    );
};

export const RecordingControls = () => {
    const isGuest = useGuestContext();

    // Don't show recording controls for guests users.
    if (isGuest) {
        return null;
    }

    return <RecordingControlsInternal />;
};
