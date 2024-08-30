import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps} from '@proton/components';
import { BasicModal, PrimaryButton, useModalTwoStatic } from '@proton/components';

type Props = {
    type?: FileThresholdModalType;
    onSubmit: () => void;
    onCancel: () => void;
};

export type FileThresholdModalType = 'fileNumberTotal' | 'fileSizeTotal';

export const FileThresholdModal = ({
    onSubmit,
    onCancel,
    onClose,
    type = 'fileNumberTotal',
    open,
    ...modalProps
}: Props & ModalStateProps) => {
    const handleCancel = () => {
        onCancel();
        onClose?.();
    };

    return (
        <BasicModal
            title={
                type === 'fileNumberTotal'
                    ? c('Title').t`Performance might be affected`
                    : c('Title').t`Uploading a large file or folder`
            }
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
            {...modalProps}
        >
            <p>
                {type === 'fileNumberTotal'
                    ? c('Info').t`Uploading hundreds of files at once may have a performance impact.`
                    : c('Info')
                          .t`For best results, avoid streaming and memory-intensive activities or split your upload into smaller batches.`}
            </p>
        </BasicModal>
    );
};

export const useFileThresholdModal = () => {
    return useModalTwoStatic(FileThresholdModal);
};
