import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import { BasicModal, PrimaryButton, useModalTwoStatic } from '@proton/components';
import { DOCS_APP_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';

type Props = {
    onCancel?: () => void;
    onSubmit?: () => void;
};

export default function DownloadContainsDocumentsModal({
    onSubmit,
    onCancel,
    onClose,
    open,
    ...modalProps
}: Props & ModalStateProps) {
    const handleCancel = () => {
        onCancel?.();
        onClose();
    };

    return (
        <BasicModal
            title={
                // translator: Your download has a Proton Docs file
                c('Title').t`Your download has a ${DOCS_APP_NAME} file`
            }
            isOpen={open === undefined ? true : open}
            onClose={handleCancel}
            footer={
                <>
                    <Button onClick={handleCancel}>{c('Action').t`Cancel download`}</Button>
                    <PrimaryButton
                        onClick={() => {
                            onSubmit?.();
                            onClose();
                        }}
                    >
                        {c('Action').t`Understood`}
                    </PrimaryButton>
                </>
            }
            {...modalProps}
        >
            <p>{
                // translator: Downloading Proton Docs files from Proton Drive is currently not supported (...)
                c('Info')
                    .t`Downloading ${DOCS_APP_NAME} files from ${DRIVE_APP_NAME} is currently not supported — these will not be included in your download.`
            }</p>
            <p>{
                // translator: Please export them directly from the Proton Docs application (...)
                c('Info')
                    .t`Please export them directly from the ${DOCS_APP_NAME} application instead if you wish to download them.`
            }</p>
        </BasicModal>
    );
}

export const useDownloadContainsDocumentsModal = () => {
    return useModalTwoStatic(DownloadContainsDocumentsModal);
};
