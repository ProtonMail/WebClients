import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { clearRecording } from '@proton/meet/store/slices/recordingsSlice';
import { UpsellModalTypes } from '@proton/meet/types/types';
import upsellExpiredMeetingModalIcon from '@proton/styles/assets/img/meet/upsell-expired-meeting-modal-icon.svg';
import upsellModalIcon from '@proton/styles/assets/img/meet/upsell-modal-icon.svg';

import { useLastRecordingDownload } from '../../../hooks/useMeetingRecorder/hooks/useLastRecordingDownload';
import { CTAModalShell } from '../shared/CTAModalShell';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackThankYou } from './FeedbackThankYou';

type EndCallModalShellProps = {
    open: boolean;
    onClose: () => void;
    actions?: ReactNode;
    rejoin?: () => void;
    title: ReactNode;
    subtitle: ReactNode;
    upsellModalType?: UpsellModalTypes;
};

export const EndCallModalShell = ({
    open,
    onClose,
    actions,
    rejoin,
    title,
    subtitle,
    upsellModalType,
}: EndCallModalShellProps) => {
    const dispatch = useMeetDispatch();

    const [isFinished, setIsFinished] = useState(false);
    const isExpired =
        upsellModalType === UpsellModalTypes.MeetingExpiredHostPaid ||
        upsellModalType === UpsellModalTypes.MeetingExpiredHostFree;

    const handleSubmit = () => {
        setIsFinished(true);
    };

    const handleClose = () => {
        onClose();
        dispatch(clearRecording());
    };

    const { downloadLastRecording, hasRecordingToDownload } = useLastRecordingDownload();
    const handleDownloadRecording = async () => {
        try {
            await downloadLastRecording();
        } catch {
            // Cancelled or failed, keep the modal open so the user can retry.
        }
    };

    if (isFinished) {
        return <FeedbackThankYou open={open} onClose={handleClose} />;
    }

    return (
        <CTAModalShell
            open={open}
            onClose={handleClose}
            icon={
                <img
                    src={isExpired ? upsellExpiredMeetingModalIcon : upsellModalIcon}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '4.5em', '--h-custom': '4.5em' }}
                />
            }
            title={title}
            subtitle={subtitle}
            headerClassName="pt-10"
            titleClassName="text-semibold"
            actions={
                <>
                    <div className="flex flex-column md:flex-row gap-2 items-center w-full">
                        {hasRecordingToDownload && (
                            <Button
                                className="create-account-low-pressure-button rounded-full px-10 py-4 text-semibold w-full"
                                onClick={handleDownloadRecording}
                                size="medium"
                            >
                                {c('Action').t`Download recording`}
                            </Button>
                        )}
                        {actions}
                    </div>
                    {rejoin && (
                        <div className="w-full flex justify-center gap-2 pt-10 pb-5 text-semibold max-w-custom">
                            <span className="color-weak">{c('Info').t`Left by mistake?`}</span>
                            <InlineLinkButton
                                className="rejoin-meeting-button"
                                onClick={() => {
                                    rejoin();
                                    handleClose();
                                }}
                            >{c('Action').t`Rejoin meeting`}</InlineLinkButton>
                        </div>
                    )}
                </>
            }
            footer={isExpired ? <></> : <FeedbackForm onClose={handleClose} onSubmit={handleSubmit} />}
        />
    );
};
