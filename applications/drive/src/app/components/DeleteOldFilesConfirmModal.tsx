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
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';

interface Props {
    onClose?: () => void;
    onSubmit: () => Promise<unknown>;
}

const WARNING_TITLE = c('Label').t`WARNING: DELETION IS PERMANENT`;
const WARNING_INFO = c('Info').t`Are you sure you want to delete your old files \
permanently? Your old files will be deleted in 72 hours.`;
const WARNING_CONFIRMATION_TEXT = c('Label').t`Yes, I want to permanently delete \
my old files`;

const DeleteOldFilesConfirmModal = ({ onClose = noop, onSubmit, ...rest }: Props) => {
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, withLoading] = useLoading();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(e.target.checked);
    };

    const modalTitleID = 'DeleteOldFilesConfirmModal';

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} small disableCloseOnOnEscape={isLoading} {...rest}>
            <HeaderModal hasClose displayTitle noEllipsis modalTitleID={modalTitleID} onClose={onClose}>
                {c('Action').t`Delete old files`}
            </HeaderModal>
            <ContentModal onReset={onClose} onSubmit={() => withLoading(onSubmit())}>
                <InnerModal className="mb1">
                    <Alert type="warning" className="mb2">
                        <span>
                            <strong>{WARNING_TITLE}</strong>
                        </span>
                        <p className="m0">{WARNING_INFO}</p>
                    </Alert>
                    <Checkbox onChange={handleChange}>{WARNING_CONFIRMATION_TEXT}</Checkbox>
                </InnerModal>
                <FooterModal>
                    <Button color="weak" type="button" onClick={onClose}>
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button color="danger" type="submit" disabled={!isChecked || isLoading}>
                        {c('Action').t`Delete`}
                    </Button>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};

export default DeleteOldFilesConfirmModal;
