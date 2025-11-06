import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { AppLink, Checkbox, Label, Prompt } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import type { MailSettings, Recipient } from '@proton/shared/lib/interfaces';
import { BLOCK_SENDER_CONFIRMATION } from '@proton/shared/lib/mail/constants';

interface Props extends ModalProps {
    onConfirm: (blockSenderConfirmation: boolean) => void;
    senders: Recipient[];
    mailSettings: MailSettings;
    onResolve: () => void;
    onReject: () => void;
}

const BlockSenderModal = ({ senders, onConfirm, mailSettings, onResolve, onReject, ...rest }: Props) => {
    const [blockSenderConfirmation, setBlockSenderConfirmation] = useState(false);

    const handleConfirm = () => {
        onConfirm(blockSenderConfirmation);
        onResolve();
    };

    const manageBlockedAddressesSettingsLink = (
        <AppLink key={'manageMessageAddressLink'} to="mail/filters#spam" toApp={APPS.PROTONACCOUNT}>{c('Link')
            .t`Manage blocked email addresses`}</AppLink>
    );

    const sendersEmails = senders.map((sender) => {
        return sender?.Address;
    });

    const senderEmailAddress = sendersEmails.slice(0, 2).join(', ');

    const otherSendersCount = sendersEmails.length - 2;

    const blockSendersText =
        sendersEmails.length <= 2
            ? // translator: The variable contains email addresses (up to two mail addresses) that will be blocked
              // Full sentence for reference "New emails from user1@domain.com, user2@domain.com won't be delivered and will be permanently deleted."
              c('Description')
                  .t`New emails from ${senderEmailAddress} won't be delivered and will be permanently deleted.`
            : // translator: The variables are the following
              // ${senderEmailAddress}: contains email addresses (up to two mail addresses) that will be blocked
              // ${otherSendersCount}: since we display two addresses, the variable contains the number of address remaining which will be blocked
              // Full sentence for reference "New emails from user1@domain.com, user2@domain.com and X others won't be delivered and will be permanently deleted."
              c('Description').ngettext(
                  msgid`New emails from ${senderEmailAddress} and ${otherSendersCount} other won't be delivered and will be permanently deleted.`,
                  `New emails from ${senderEmailAddress} and ${otherSendersCount} others won't be delivered and will be permanently deleted.`,
                  otherSendersCount
              );

    // translator: The variable is a link to the settings page
    // Full sentence for reference "Manage blocked email addresses in settings."
    const manageInSettingsText = c('Description').jt`${manageBlockedAddressesSettingsLink} in settings.`;

    useEffect(() => {
        setBlockSenderConfirmation(mailSettings.BlockSenderConfirmation === BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK);
    }, [mailSettings.BlockSenderConfirmation]);

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Prompt
                title={c('Title').t`Block sender`}
                buttons={[
                    <Button
                        key="submit"
                        type="submit"
                        color="warning"
                        onClick={handleConfirm}
                        data-testid="block-sender-modal-block:button"
                    >
                        {c('Action').t`Block`}
                    </Button>,
                    <Button key="reset" type="reset" onClick={onReject}>
                        {c('Action').t`Cancel`}
                    </Button>,
                ]}
                {...rest}
            >
                <div>
                    <p className="text-break">
                        <span>{blockSendersText}</span>
                        <span className="ml-1">{manageInSettingsText}</span>
                    </p>
                    <Label htmlFor="block-sender-confirmation" className="flex text-center">
                        <Checkbox
                            id="block-sender-confirmation"
                            checked={blockSenderConfirmation}
                            onChange={() => {
                                setBlockSenderConfirmation(!blockSenderConfirmation);
                            }}
                            data-testid="block-sender-modal-dont-show:checkbox"
                            className="mr-1"
                        />
                        {c('Label').t`Don't show this again`}
                    </Label>
                </div>
            </Prompt>
        </div>
    );
};

export default BlockSenderModal;
