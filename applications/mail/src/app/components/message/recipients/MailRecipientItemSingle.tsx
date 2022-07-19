import { MouseEvent, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { DropdownMenuButton, Icon, useModalState, usePopperAnchor } from '@proton/components/components';
import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';
import { useApi, useMailSettings, useNotifications } from '@proton/components/hooks';
import { PublicKeyReference } from '@proton/crypto';
import { updateBlockSenderConfirmation } from '@proton/shared/lib/api/mailSettings';
import { MAILBOX_LABEL_IDS, VIEW_LAYOUT } from '@proton/shared/lib/constants';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { isAddressIncluded, isBlockedIncomingDefaultAddress } from '@proton/shared/lib/helpers/incomingDefaults';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { BLOCK_SENDER_CONFIRMATION } from '@proton/shared/lib/mail/constants';

import { MESSAGE_ACTIONS } from '../../../constants';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { getContactEmail } from '../../../helpers/addresses';
import { getHumanLabelID } from '../../../helpers/labels';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import {
    useIncomingDefaultsAddresses,
    useIncomingDefaultsStatus,
} from '../../../hooks/incomingDefaults/useIncomingDefaults';
import { blockAddress } from '../../../logic/incomingDefaults/incomingDefaultsActions';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import BlockSenderModal from '../modals/BlockSenderModal';
import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';
import RecipientItemSingle from './RecipientItemSingle';

interface Props {
    message?: MessageState;
    recipient: Recipient;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    signingPublicKey?: PublicKeyReference;
    attachedPublicKey?: PublicKeyReference;
    isNarrow?: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
    hideAddress?: boolean;
    isRecipient?: boolean;
    isExpanded?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
}

const MailRecipientItemSingle = ({
    message,
    recipient,
    mapStatusIcons,
    globalIcon,
    signingPublicKey,
    attachedPublicKey,
    isNarrow,
    showDropdown,
    isOutside,
    hideAddress,
    isRecipient,
    isExpanded,
    onContactDetails,
    onContactEdit,
}: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const history = useHistory();

    const dispatch = useDispatch();
    const [showBlockSenderModal, setShowBlockSenderModal] = useState(false);
    const incomingDefaultsAddresses = useIncomingDefaultsAddresses();
    const incomingDefaultsStatus = useIncomingDefaultsStatus();
    const isBlocked = isBlockedIncomingDefaultAddress(incomingDefaultsAddresses, message?.data?.Sender.Address || '');

    const contactsMap = useContactsMap();
    const { getRecipientLabel } = useRecipientLabel();
    const [mailSettings] = useMailSettings();
    const onCompose = useOnCompose();

    const [trustPublicKeyModalProps, setTrustPublicKeyModalOpen, renderTrustPublicKeyModal] = useModalState();

    const { ContactID } = getContactEmail(contactsMap, recipient.Address) || {};
    const label = getRecipientLabel(recipient, true);

    const showTrustPublicKey = !!signingPublicKey || !!attachedPublicKey;

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
            const humanLabelID = getHumanLabelID(MAILBOX_LABEL_IDS.ALL_MAIL);
            let newPathname = `/${humanLabelID}`;

            if (mailSettings?.ViewLayout === VIEW_LAYOUT.COLUMN) {
                const pathname = history.location.pathname.split('/');
                pathname[1] = humanLabelID;
                newPathname = pathname.join('/');
            }

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

    const handleBlockSender = async () => {
        const senderEmail = message?.data?.Sender.Address;

        if (!senderEmail) {
            return;
        }

        const foundItem = isAddressIncluded(incomingDefaultsAddresses, senderEmail);

        await dispatch(
            blockAddress({ api, address: senderEmail, ID: foundItem?.ID, type: foundItem ? 'update' : 'create' })
        );

        createNotification({ text: c('Notification').t`Sender ${senderEmail} blocked` });
    };

    // Mail dropdown
    const handleClickBlockSender = (event: MouseEvent) => {
        event.stopPropagation();

        if (mailSettings?.BlockSenderConfirmation !== BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK) {
            setShowBlockSenderModal(true);
        } else {
            void handleBlockSender();
        }

        // Close dropdown in order to
        // avoid modal and dropdown opened at same time
        close();
    };

    // Modal confirm
    const handleSubmitBlockSender = async (checked: boolean) => {
        const isSettingChecked = mailSettings?.BlockSenderConfirmation === 1;
        const confirmHasChanged = checked !== isSettingChecked;

        if (confirmHasChanged) {
            await api(updateBlockSenderConfirmation(checked ? BLOCK_SENDER_CONFIRMATION.DO_NOT_ASK : null));
        }

        await handleBlockSender();
    };

    const customDropdownActions = (
        <>
            <hr className="my0-5" />
            <DropdownMenuButton className="text-left flex flex-nowrap flex-align-items-center" onClick={handleCompose}>
                <Icon name="envelope" className="mr0-5" />
                <span className="flex-item-fluid myauto">{c('Action').t`New message`}</span>
            </DropdownMenuButton>
            {ContactID ? (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={handleClickContact}
                >
                    <Icon name="user" className="mr0-5" />
                    <span className="flex-item-fluid myauto">{c('Action').t`View contact details`}</span>
                </DropdownMenuButton>
            ) : (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={handleClickContact}
                >
                    <Icon name="user-plus" className="mr0-5" />
                    <span className="flex-item-fluid myauto">{c('Action').t`Create new contact`}</span>
                </DropdownMenuButton>
            )}
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={handleClickSearch}
            >
                <Icon name="envelope-magnifying-glass" className="mr0-5" />
                <span className="flex-item-fluid myauto">
                    {isRecipient ? c('Action').t`Messages to this recipient` : c('Action').t`Messages from this sender`}
                </span>
            </DropdownMenuButton>
            {!isBlocked && incomingDefaultsStatus === 'loaded' && (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={handleClickBlockSender}
                >
                    <Icon name="circle-slash" className="mr0-5" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                        .t`Block messages from this sender`}</span>
                </DropdownMenuButton>
            )}
            {showTrustPublicKey && (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={handleClickTrust}
                >
                    <Icon name="user" className="mr0-5" />
                    <span className="flex-item-fluid myauto">{c('Action').t`Trust public key`}</span>
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
                isNarrow={isNarrow}
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
            />
            {renderTrustPublicKeyModal && <TrustPublicKeyModal contact={contact} {...trustPublicKeyModalProps} />}
            {showBlockSenderModal && mailSettings && message?.data?.ID && (
                <BlockSenderModal
                    onConfirm={handleSubmitBlockSender}
                    mailSettings={mailSettings}
                    senderEmail={message.data.Sender.Address}
                    onClose={() => {
                        setShowBlockSenderModal(false);
                    }}
                />
            )}
        </>
    );
};

export default MailRecipientItemSingle;
