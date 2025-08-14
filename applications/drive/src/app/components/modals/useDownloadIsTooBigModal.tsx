import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import { BasicModal, useModalTwoStatic } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { getAppStaticUrl } from '@proton/shared/lib/helpers/url';

export const useDownloadIsTooBigModal = () => {
    return useModalTwoStatic(DownloadIsTooBigModal);
};

type Props = {
    onCancel?: () => void;
    onSubmit?: () => void;
};

function DownloadIsTooBigModal({ onSubmit, onCancel, onClose, open, ...modalProps }: Props & ModalStateProps) {
    const handleCancel = () => {
        onCancel?.();
        onClose();
    };

    const handleContinue = () => {
        onSubmit?.();
        onClose();
    };

    return (
        <BasicModal
            title={c('Title').t`Browser might run out of memory`}
            isOpen={open === undefined ? true : open}
            onClose={onClose}
            footer={<TooBigModalFooter onCancel={handleCancel} onContinue={handleContinue} />}
            {...modalProps}
        >
            <p>{c('Info')
                .jt`Your current browser does not support the downloading of large files/multiple files. Download the desktop app for seamless uploads and downloads.`}</p>
        </BasicModal>
    );
}

function TooBigModalFooter({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) {
    return (
        <>
            <Button onClick={onContinue}>{c('Action').t`Continue on web`}</Button>
            <Button
                color="norm"
                onClick={() => {
                    openNewTab(`${getAppStaticUrl(APPS.PROTONDRIVE)}/download`);
                    onCancel();
                }}
            >
                {c('Action').t`Download app`}
            </Button>
        </>
    );
}
