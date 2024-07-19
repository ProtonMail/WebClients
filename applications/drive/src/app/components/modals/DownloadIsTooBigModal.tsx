import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import { BasicModal, PrimaryButton, useModalTwoStatic } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

type Props = {
    onCancel?: () => void;
    onSubmit?: () => void;
};

export default function DownloadIsTooBigModal({
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

    const recommendedBrowser = (
        <a href={getKnowledgeBaseUrl('/recommended-browsers')} target="_blank">
            {c('Info').t`recommended browser`}
        </a>
    );

    return (
        <BasicModal
            title={c('Title').t`Browser might run out of memory`}
            isOpen={open === undefined ? true : open}
            onClose={handleCancel}
            footer={
                <>
                    <Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
                    <PrimaryButton
                        onClick={() => {
                            onSubmit?.();
                            onClose();
                        }}
                    >
                        {c('Action').t`Download anyway`}
                    </PrimaryButton>
                </>
            }
            {...modalProps}
        >
            <p>{c('Info')
                .jt`Your current browser does not support the downloading of large files due to the unavailability of service workers. Downloading large files may freeze or leave the browser unresponsive. Please use the latest versions of a ${recommendedBrowser} and try again.`}</p>
        </BasicModal>
    );
}

export const useDownloadIsTooBigModal = () => {
    return useModalTwoStatic(DownloadIsTooBigModal);
};
