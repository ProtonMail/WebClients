import { c } from 'ttag';

import { IcArrowDownCircle } from '@proton/icons/icons/IcArrowDownCircle';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { clearRecording, selectRecordingStatus } from '@proton/meet/store/slices/recordingsSlice';

import { useLastRecordingDownload } from '../../../hooks/useMeetingRecorder/hooks/useLastRecordingDownload';
import { ConfirmationModal } from '../../ConfirmationModal/ConfirmationModal';
import { RecordingProcessingModal } from './RecordingProcessingModal';

export const RecordingDownloadModal = () => {
    const dispatch = useMeetDispatch();
    const status = useMeetSelector(selectRecordingStatus);
    const { downloadLastRecording } = useLastRecordingDownload();

    if (status === null) {
        return null;
    }

    const close = () => dispatch(clearRecording());

    if (status === 'error') {
        return (
            <ConfirmationModal
                title={c('Title').t`Couldn't prepare the recording`}
                primaryText={c('Action').t`Close`}
                onPrimaryAction={close}
                onClose={close}
            />
        );
    }

    if (status === 'processing') {
        return <RecordingProcessingModal />;
    }

    const handleDownload = async () => {
        try {
            await downloadLastRecording();
            close();
        } catch {
            // Cancelled or failed, keep the modal open so the user can retry.
        }
    };

    return (
        <ConfirmationModal
            icon={<IcArrowDownCircle size={15} />}
            title={c('Title').t`Your recording is ready`}
            primaryText={c('Action').t`Download`}
            onPrimaryAction={handleDownload}
            secondaryText={c('Action').t`Close`}
            onSecondaryAction={close}
            onClose={close}
        />
    );
};
