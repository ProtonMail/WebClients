import type { MouseEvent } from 'react';
import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { DropdownMenuButton, Icon, useModalState, usePopperAnchor } from '@proton/components';
import type { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';
import type { PublicKeyReference } from '@proton/crypto';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { ALMOST_ALL_MAIL } from '@proton/shared/lib/mail/mailSettings';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { MESSAGE_ACTIONS } from '../../../constants';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { getHumanLabelID } from '../../../helpers/labels';
import { getContactEmail } from '../../../helpers/message/messageRecipients';
import { ComposeTypes } from '../../../hooks/composer/useCompose';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import useBlockSender from '../../../hooks/useBlockSender';
import type { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import type { Element } from '../../../models/element';
import type { MessageState } from '../../../store/messages/messagesTypes';
import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';
import RecipientItemSingle from './RecipientItemSingle';

interface Props {
    message?: MessageState;
    recipient: Recipient;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    signingPublicKey?: PublicKeyReference;
    attachedPublicKey?: PublicKeyReference;
    isSmallViewport?: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
    hideAddress?: boolean;
    isRecipient?: boolean;
    isExpanded?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
    customDataTestId?: string;
    hasHeading?: boolean;
}

const MailRecipientItemSingle = ({
    message,
    recipient,
    mapStatusIcons,
    globalIcon,
    signingPublicKey,
    attachedPublicKey,
    isSmallViewport,
    showDropdown,
    isOutside,
    hideAddress,
    isRecipient,
    isExpanded,
    onContactDetails,
    onContactEdit,
    customDataTestId,
    hasHeading = false,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const history = useHistory();

    const contactsMap = useContactsMap();
    const { getRecipientLabel } = useRecipientLabel();
    const mailSettings = useMailModel('MailSettings');
    const onCompose = useOnCompose();

    const [trustPublicKeyModalProps, setTrustPublicKeyModalOpen, renderTrustPublicKeyModal] = useModalState();

    const { ContactID } = getContactEmail(contactsMap, recipient.Address) || {};
    const label = getRecipientLabel(recipient, true);

    const showTrustPublicKey = !!signingPublicKey || !!attachedPublicKey;

    const { canShowBlockSender, handleClickBlockSender, blockSenderModal } = useBlockSender({
        elements: [message?.data || ({} as Element)],
        onCloseDropdown: close,
    });

    // We can display the block sender option in the dropdown if:
    // 1 - Block sender option can be displayed (FF and incoming are ready, item is not already blocked or self address)
    // 2 - The item is a sender and not a recipient
    const showBlockSenderOption = canShowBlockSender && !isRecipient;

    const contact = useMemo<ContactWithBePinnedPublicKey>(() => {
        return {
            emailAddress: recipient.Address || '',
            name: label,
            contactID: ContactID,
            isInternal: true,
            bePinnedPublicKey: signingPublicKey || (attachedPublicKey as PublicKeyReference),
        };
    }, [recipient, label, ContactID, signingPublicKey, attachedPublicKey]);

    const handleCompose = (event: MouseEvent) => {
        event.stopPropagation();
        onCompose({
            type: ComposeTypes.newMessage,
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: [recipient] } },
        });
        close();
    };

    const handleClickContact = (event: MouseEvent) => {
        event.stopPropagation();

        close();

        if (ContactID) {
            onContactDetails(ContactID);
            return;
        }

        onContactEdit({
            vCardContact: {
                fn: [
                    {
                        field: 'fn',
                        value: recipient.Name || recipient.Address || '',
                        uid: createContactPropertyUid(),
                    },
                ],
                email: [{ field: 'email', value: recipient.Address || '', uid: createContactPropertyUid() }],
            },
        });
    };

    const handleClickTrust = (event: MouseEvent) => {
        event.stopPropagation();
        setTrustPublicKeyModalOpen(true);
    };

    const handleClickSearch = (event: MouseEvent) => {
        event.stopPropagation();

        if (recipient.Address) {
            const humanLabelID =
                mailSettings.AlmostAllMail === ALMOST_ALL_MAIL.ENABLED
                    ? getHumanLabelID(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL)
                    : getHumanLabelID(MAILBOX_LABEL_IDS.ALL_MAIL);
            const newPathname = `/${humanLabelID}`;

            history.push(
                changeSearchParams(newPathname, history.location.hash, {
                    keyword: recipient.Address,
                    page: undefined,
                    sort: undefined,
                })
            );
        }

        close();
    };

    const customDropdownActions = (
        <>
            <hr className="my-2" />
            <DropdownMenuButton
                className="text-left flex flex-nowrap items-center"
                onClick={handleCompose}
                data-testid="recipient:new-message"
            >
                <Icon name="pen-square" className="mr-2" />
                <span className="flex-1 my-auto">{c('Action').t`New message`}</span>
            </DropdownMenuButton>
            {ContactID ? (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap items-center"
                    onClick={handleClickContact}
                    data-testid="recipient:view-contact-details"
                >
                    <Icon name="user" className="mr-2" />
                    <span className="flex-1 my-auto">{c('Action').t`View contact details`}</span>
                </DropdownMenuButton>
            ) : (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap items-center"
                    onClick={handleClickContact}
                    data-testid="recipient:create-new-contact"
                >
                    <Icon name="user-plus" className="mr-2" />
                    <span className="flex-1 my-auto">{c('Action').t`Create new contact`}</span>
                </DropdownMenuButton>
            )}
            <DropdownMenuButton
                className="text-left flex flex-nowrap items-center"
                onClick={handleClickSearch}
                data-testid="recipient:search-messages"
            >
                <Icon name="envelope-magnifying-glass" className="mr-2" />
                <span className="flex-1 my-auto">
                    {isRecipient ? c('Action').t`Messages to this recipient` : c('Action').t`Messages from this sender`}
                </span>
            </DropdownMenuButton>
            {showBlockSenderOption && (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap items-center"
                    onClick={handleClickBlockSender}
                    data-testid="block-sender:button"
                >
                    <Icon name="circle-slash" className="mr-2" />
                    <span className="flex-1 my-auto">{c('Action').t`Block messages from this sender`}</span>
                </DropdownMenuButton>
            )}
            {showTrustPublicKey && (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap items-center"
                    onClick={handleClickTrust}
                    data-testid="recipient:show-trust-public-key"
                >
                    <Icon name="user" className="mr-2" />
                    <span className="flex-1 my-auto">{c('Action').t`Trust public key`}</span>
                </DropdownMenuButton>
            )}
        </>
    );

    return (
        <>
            <RecipientItemSingle
                message={message}
                recipient={recipient}
                mapStatusIcons={mapStatusIcons}
                globalIcon={globalIcon}
                isSmallViewport={isSmallViewport}
                showDropdown={showDropdown}
                actualLabel={label}
                customDropdownActions={customDropdownActions}
                anchorRef={anchorRef}
                toggle={toggle}
                close={close}
                isOpen={isOpen}
                isOutside={isOutside}
                hideAddress={hideAddress}
                isRecipient={isRecipient}
                isExpanded={isExpanded}
                customDataTestId={customDataTestId}
                hasHeading={hasHeading}
            />
            {renderTrustPublicKeyModal && <TrustPublicKeyModal contact={contact} {...trustPublicKeyModalProps} />}
            {blockSenderModal}
        </>
    );
};

export default MailRecipientItemSingle;
