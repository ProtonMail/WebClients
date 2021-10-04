import React from 'react';
import {
    Button,
    ButtonLike,
    ContentModal,
    DialogModal,
    FooterModal,
    HeaderModal,
    InnerModal,
    SettingsLink,
} from '@proton/components';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { APPS } from '@proton/shared/lib/constants';

interface Props {
    onClose?: () => void;
    onBack?: () => void;
    onSubmit?: () => void;
}

const UnlockDriveConfirmationDialog = ({ onClose = noop, onSubmit = noop, onBack, ...rest }: Props) => {
    const modalTitleID = 'UnlockDriveConfirmationDialog';

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} small {...rest}>
            <HeaderModal hasClose displayTitle noEllipsis modalTitleID={modalTitleID} onClose={onClose}>
                {c('Label').t`Unlock Drive`}
            </HeaderModal>
            <ContentModal onReset={onClose} onSubmit={() => onSubmit()}>
                <InnerModal className="mb1">
                    <p>{c('Info').t`Because Proton Drive uses end-to-end encryption, we cannot automatically
                        decrypt your files for you. You must have one of the following to recover
                        your Drive after a password reset:`}</p>
                    <ul>
                        <li>{c('Info').t`Your previous password`}</li>
                        <li>{c('Info').t`A existing Recovery File`}</li>
                        <li>{c('Info').t`Your previous Recovery Phrase`}</li>
                    </ul>
                    <p>
                        {c('Info')
                            .t`If you have one of these, click continue to go to Proton account settings to recover data.`}
                    </p>
                </InnerModal>
                <FooterModal>
                    <Button color="weak" type="button" onClick={onBack}>
                        {c('Action').t`Back`}
                    </Button>
                    <ButtonLike
                        as={SettingsLink}
                        type="submit"
                        color="norm"
                        path="/encryption-keys?action=reactivate#addresses"
                        app={APPS.PROTONMAIL}
                        data-test-id="drive-key-reactivations-options:continue"
                    >
                        {c('Action').t`Continue`}
                    </ButtonLike>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};

export default UnlockDriveConfirmationDialog;
