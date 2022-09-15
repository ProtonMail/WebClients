import { MouseEvent, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { DropdownMenuButton, Icon, useModalState, usePopperAnchor } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';
import { useFeature, useMailSettings } from '@proton/components/hooks';
import { PublicKeyReference } from '@proton/crypto';
import { MAILBOX_LABEL_IDS, VIEW_LAYOUT } from '@proton/shared/lib/constants';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';

import { MESSAGE_ACTIONS } from '../../../constants';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { getContactEmail, isSelfAddress } from '../../../helpers/addresses';
import { getHumanLabelID } from '../../../helpers/labels';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import useBlockSender from '../../../hooks/useBlockSender';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
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
    const { feature: blockSenderFeature } = useFeature(FeatureCode.BlockSender);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const history = useHistory();

    const contactsMap = useContactsMap();
    const { getRecipientLabel } = useRecipientLabel();
    const [mailSettings] = useMailSettings();
    const onCompose = useOnCompose();

    const [trustPublicKeyModalProps, setTrustPublicKeyModalOpen, renderTrustPublicKeyModal] = useModalState();

    const { ContactID } = getContactEmail(contactsMap, recipient.Address) || {};
    const label = getRecipientLabel(recipient, true);

    const showTrustPublicKey = !!signingPublicKey || !!attachedPublicKey;

    const { isBlocked, incomingDefaultsStatus, handleClickBlockSender, blockSenderModal } = useBlockSender({
        message,
        onCloseDropdown: close,
    });

    // We can display the block sender option in the dropdown if:
    // 1 - The feature flag is enabled
    // 2 - The sender is not already blocked
    // 3 - Incoming defaults addresses are loaded
    // 4 - We don't want to block self addresses
    // 5 - The item is a sender and not a recipient
    const showBlockSenderOption =
        blockSenderFeature?.Value === true &&
        !isBlocked &&
        incomingDefaultsStatus === 'loaded' &&
        !isSelfAddress(message?.data?.Sender.Address, addresses) &&
        !isRecipient;

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
            {showBlockSenderOption && (
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
            {blockSenderModal}
        </>
    );
};

export default MailRecipientItemSingle;
