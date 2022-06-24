import { c } from 'ttag';

import { BasicModal, Button, PrimaryButton } from '@proton/components';

type Props = {
    open?: boolean;
    type?: FileThresholdModalType;
    onClose?: () => void;
    onSubmit: () => void;
    onCancel: () => void;
};

export type FileThresholdModalType = 'fileNumberTotal' | 'fileSizeTotal';

export const FileThresholdModal = ({ onSubmit, onCancel, onClose, open, type = 'fileNumberTotal' }: Props) => {
    const handleCancel = () => {
        onCancel();
        onClose?.();
    };

    return (
        <BasicModal
            title={c('Title').t`Performance might be affected`}
            isOpen={open === undefined ? true : open}
            onClose={handleCancel}
            footer={
                <>
                    <Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
                    <PrimaryButton
                        onClick={() => {
                            onSubmit();
                            onClose?.();
                        }}
                    >
                        {c('Action').t`Upload anyway`}
                    </PrimaryButton>
                </>
            }
        >
            <p>
                {type === 'fileNumberTotal'
                    ? c('Info').t`Uploading hundreds of files at once may have a performance impact.`
                    : c('Info')
                          .t`Bulk uploads may reduce your computer’s performance. Consider limiting memory-intensive activities like streaming during upload. Or try uploading in batches.`}
            </p>
        </BasicModal>
    );
};
