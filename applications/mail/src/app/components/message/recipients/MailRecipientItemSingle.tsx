import { MouseEvent, useMemo } from 'react';
import { c } from 'ttag';
import {
    ContactModal,
    ContactDetailsModal,
    DropdownMenuButton,
    Icon,
    useModals,
    usePopperAnchor,
    useModalState,
} from '@proton/components';
import { OpenPGPKey } from 'pmcrypto';
import { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { Recipient } from '@proton/shared/lib/interfaces';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { getContactEmail } from '../../../helpers/addresses';
import { useOnCompose, useOnMailTo } from '../../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../../constants';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import RecipientItemSingle from './RecipientItemSingle';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message?: MessageState;
    recipient: Recipient;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showAddress?: boolean;
    showLockIcon?: boolean;
    signingPublicKey?: OpenPGPKey;
    attachedPublicKey?: OpenPGPKey;
    isNarrow?: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
}

const MailRecipientItemSingle = ({
    message,
    recipient,
    mapStatusIcons,
    globalIcon,
    showAddress = true,
    showLockIcon = true,
    signingPublicKey,
    attachedPublicKey,
    isNarrow,
    showDropdown,
    isOutside,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { createModal } = useModals();
    const contactsMap = useContactsMap();
    const { getRecipientLabel } = useRecipientLabel();

    const onCompose = useOnCompose();
    const onMailTo = useOnMailTo();

    const [trustPublicKeyModalProps, setTrustPublicKeyModalOpen] = useModalState();

    const { ContactID } = getContactEmail(contactsMap, recipient.Address) || {};
    const label = getRecipientLabel(recipient, true);

    const showTrustPublicKey = !!signingPublicKey || !!attachedPublicKey;

    const contact = useMemo<ContactWithBePinnedPublicKey>(() => {
        return {
            emailAddress: recipient.Address || '',
            name: label,
            contactID: ContactID,
            isInternal: true,
            bePinnedPublicKey: (signingPublicKey as OpenPGPKey) || (attachedPublicKey as OpenPGPKey),
        };
    }, [recipient, label, ContactID, signingPublicKey, attachedPublicKey]);

    const handleCompose = (event: MouseEvent) => {
        event.stopPropagation();
        onCompose({
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: [recipient] } },
        });
        close();
    };

    const handleClickContact = (event: MouseEvent) => {
        event.stopPropagation();

        if (ContactID) {
            createModal(<ContactDetailsModal contactID={ContactID} onMailTo={onMailTo} />);
            return;
        }

        createModal(
            <ContactModal
                properties={[
                    { field: 'email', value: recipient.Address || '' },
                    { field: 'fn', value: recipient.Name || recipient.Address || '' },
                ]}
            />
        );
    };

    const handleClickTrust = (event: MouseEvent) => {
        event.stopPropagation();
        setTrustPublicKeyModalOpen(true);
    };

    const customDropdownActions = (
        <>
            <hr className="my0-5" />
            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleCompose}>
                <Icon name="envelope" className="mr0-5 mt0-25" />
                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`New message`}</span>
            </DropdownMenuButton>
            {ContactID ? (
                <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleClickContact}>
                    <Icon name="user" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View contact details`}</span>
                </DropdownMenuButton>
            ) : (
                <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleClickContact}>
                    <Icon name="user-plus" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Create new contact`}</span>
                </DropdownMenuButton>
            )}

            {showTrustPublicKey && (
                <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleClickTrust}>
                    <Icon name="user" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Trust Public Key`}</span>
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
                showAddress={showAddress}
                showLockIcon={showLockIcon}
                isNarrow={isNarrow}
                showDropdown={showDropdown}
                actualLabel={label}
                customDropdownActions={customDropdownActions}
                anchorRef={anchorRef}
                toggle={toggle}
                close={close}
                isOpen={isOpen}
                isOutside={isOutside}
            />
            <TrustPublicKeyModal contact={contact} {...trustPublicKeyModalProps} />
        </>
    );
};

export default MailRecipientItemSingle;
