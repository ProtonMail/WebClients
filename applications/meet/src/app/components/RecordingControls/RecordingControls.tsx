import { useRef, useState } from 'react';

import { addSeconds, format, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useNotifications } from '@proton/components';
import { IcMeetRecord } from '@proton/icons/icons/IcMeetRecord';
import { IcMeetRecordStop } from '@proton/icons/icons/IcMeetRecordStop';
import { isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import { dateLocale } from '@proton/shared/lib/i18n';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMeetingRecorderContext } from '../../contexts/MeetingRecorderContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';

import './RecordingControls.scss';

export const RecordingControls = () => {
    const isMeetingRecordingEnabled = useFlag('MeetingRecording');
    const { startRecording, downloadRecording, recordingState } = useMeetingRecorderContext();
    const { createNotification } = useNotifications();

    const durationIntervalRef = useRef<number>();

    const isLargerThanMd = useIsLargerThanMd();

    const [duration, setDuration] = useState(0);

    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();

    const recordingNotSupported = isMobile() || isFirefox();

    const hasAdminPermission = isLocalParticipantAdmin || isLocalParticipantHost;

    const shouldDisplayRecordingControls = hasAdminPermission && isMeetingRecordingEnabled;

    const handleStartRecording = async () => {
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
        <div className="recording-controls flex items-center gap-2">
            {!recordingState.isRecording ? (
                <CircleButton
                    IconComponent={IcMeetRecord}
                    onClick={handleStartRecording}
                    ariaLabel={c('Action').t`Start recording`}
                    size={6}
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
                    aria-label={c('Alt').t`Leave Meeting`}
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
    );
};
