import React, { useState } from 'react';
import {
    Alert,
    Button,
    Checkbox,
    ContentModal,
    DialogModal,
    FooterModal,
    HeaderModal,
    InnerModal,
    useLoading,
} from '@proton/components';
import { c, msgid } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';

interface Props {
    onClose?: () => void;
    onBack?: () => void;
    onSubmit: () => Promise<unknown>;
    volumeCount: number;
}

const DeleteLockedVolumesConfirmModal = ({ onClose = noop, onSubmit, onBack, volumeCount, ...rest }: Props) => {
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, withLoading] = useLoading();

    const modalTitle = c('Label').ngettext(msgid`Delete Drive`, `Delete Drives`, volumeCount);

    const warningTitle = c('Label').t`WARNING: DELETION IS PERMANENT`;
    const warningInfo = c('Info').t`Are you sure you want to delete your old files
        permanently? Your old files will be deleted in 72 hours.`;
    const confirmationText = c('Label').t`Yes, I want to permanently delete
        my old files`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(e.target.checked);
    };

    const modalTitleID = 'DeleteOldFilesConfirmModal';

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} small disableCloseOnOnEscape={isLoading} {...rest}>
            <HeaderModal hasClose displayTitle noEllipsis modalTitleID={modalTitleID} onClose={onClose}>
                {modalTitle}
            </HeaderModal>
            <ContentModal onReset={onClose} onSubmit={() => withLoading(onSubmit())}>
                <InnerModal className="mb1">
                    <Alert type="warning" className="mb2">
                        <span>
                            <strong className="text-uppercase">{warningTitle}</strong>
                        </span>
                        <p className="m0">{warningInfo}</p>
                    </Alert>
                    <Checkbox onChange={handleChange}>{confirmationText}</Checkbox>
                </InnerModal>
                <FooterModal>
                    <Button color="weak" type="button" onClick={onBack}>
                        {c('Action').t`Back`}
                    </Button>
                    <Button color="danger" type="submit" disabled={!isChecked || isLoading}>
                        {c('Action').t`Delete`}
                    </Button>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};

export default DeleteLockedVolumesConfirmModal;
