import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { AlertModal, AppLink, Button, Checkbox, Label, ModalProps } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { BLOCK_SENDER_CONFIRMATION } from '@proton/shared/lib/mail/constants';

interface Props extends ModalProps {
    onConfirm: (blockSenderConfirmation: boolean) => void;
    senderEmail: string;
    mailSettings: MailSettings;
    onResolve: () => void;
    onReject: () => void;
}

const BlockSenderModal = ({ senderEmail, onConfirm, mailSettings, onResolve, onReject, ...rest }: Props) => {
    const [blockSenderConfirmation, setBlockSenderConfirmation] = useState(false);

    const handleConfirm = () => {
        onConfirm(blockSenderConfirmation);
        onResolve();
    };

    const manageBlockedAddressesSettingsLink = (
        <AppLink key={'manageMessageAddressLink'} to="mail/filters#spam" toApp={APPS.PROTONACCOUNT}>{c('Link')
            .t`Manage blocked email addresses`}</AppLink>
    );

    const senderEmailAddress = <b key={'senderEmail'}>{senderEmail}</b>;

    useEffect(() => {
        setBlockSenderConfirmation(mailSettings?.BlockSenderConfirmation === BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK);
    }, [mailSettings?.BlockSenderConfirmation]);

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <AlertModal
                title={c('Title').t`Block sender`}
                buttons={[
                    <Button key="submit" type="submit" color="warning" onClick={handleConfirm}>
                        {c('Action').t`Block`}
                    </Button>,
                    <Button key="reset" type="reset" onClick={onReject}>
                        {c('Action').t`Cancel`}
                    </Button>,
                ]}
                {...rest}
            >
                <div>
                    <p>
                        {
                            // translator: Full sentence is "New emails from user@domain.com won't be delivered and will be permanently deleted. Manage blocked email addresses in settings."
                            c('Description')
                                .jt`New emails from ${senderEmailAddress} won't be delivered and will be permanently deleted. ${manageBlockedAddressesSettingsLink} in settings.`
                        }
                    </p>
                    <Label htmlFor="block-sender-confirmation">
                        <Checkbox
                            id="block-sender-confirmation"
                            checked={blockSenderConfirmation}
                            onChange={() => {
                                setBlockSenderConfirmation(!blockSenderConfirmation);
                            }}
                        />{' '}
                        {c('Label').t`Don't show this again`}
                    </Label>
                </div>
            </AlertModal>
        </div>
    );
};

export default BlockSenderModal;
