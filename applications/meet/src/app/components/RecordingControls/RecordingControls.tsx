import { useRef, useState } from 'react';

import { addSeconds, format, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useNotifications } from '@proton/components';
import { IcMeetRecord } from '@proton/icons/icons/IcMeetRecord';
import { IcMeetRecordStop } from '@proton/icons/icons/IcMeetRecordStop';
import { isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import { dateLocale } from '@proton/shared/lib/i18n';
import IcCircleRadioFilled from '@proton/styles/assets/img/meet/ic-circle-radio-filled.svg';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMeetingRecorderContext } from '../../contexts/MeetingRecorderContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

import './RecordingControls.scss';

export const RecordingControls = () => {
    const isMeetingRecordingEnabled = useFlag('MeetingRecording');
    const { startRecording, downloadRecording, recordingState } = useMeetingRecorderContext();
    const { createNotification } = useNotifications();

    const durationIntervalRef = useRef<number>();

    const isLargerThanMd = useIsLargerThanMd();

    const [duration, setDuration] = useState(0);
    const [showStartRecordingConfirmation, setShowStartRecordingConfirmation] = useState(false);

    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();

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
                        onClick={() => setShowStartRecordingConfirmation(true)}
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
        </>
    );
};
