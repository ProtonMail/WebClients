import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components';
import { BasicModal, useModalTwoStatic } from '@proton/components';
import { DOCS_APP_NAME, SHEETS_APP_NAME } from '@proton/shared/lib/constants';

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
                // translator: Your download includes Proton Docs or Sheets files
                c('Title').t`Your download includes ${DOCS_APP_NAME} or ${SHEETS_APP_NAME} files`
            }
            isOpen={open === undefined ? true : open}
            onClose={handleCancel}
            footer={
                <>
                    <Button onClick={handleCancel}>{c('Action').t`Cancel download`}</Button>
                    <Button
                        color="norm"
                        onClick={() => {
                            onSubmit?.();
                            onClose();
                        }}
                    >
                        {c('Action').t`Continue downloading`}
                    </Button>
                </>
            }
            {...modalProps}
        >
            <p>{
                // translator: Proton Docs and Sheets files cannot be downloaded directly (...)
                c('Info')
                    .t`${DOCS_APP_NAME} and ${SHEETS_APP_NAME} files cannot be downloaded directly and will not be included in this download. You can download the other files by clicking 'Continue downloading'.`
            }</p>
            <p>{
                // translator: To download these files, open them in Proton Docs or Sheets and export them.
                c('Info')
                    .t`To download these files, open them in ${DOCS_APP_NAME} or ${SHEETS_APP_NAME} and export them.`
            }</p>
        </BasicModal>
    );
}

export const useDownloadContainsDocumentsModal = () => {
    return useModalTwoStatic(DownloadContainsDocumentsModal);
};
