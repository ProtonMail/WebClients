import { MouseEvent, useMemo } from 'react';
import { c } from 'ttag';
import { DropdownMenuButton, Icon, usePopperAnchor, useModalState, useMailSettings } from '@proton/components';
import { useHistory } from 'react-router-dom';
import { PublicKeyReference } from '@proton/crypto';
import { ContactWithBePinnedPublicKey } from '@proton/shared/lib/interfaces/contacts';
import { Recipient } from '@proton/shared/lib/interfaces';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';
import { MAILBOX_LABEL_IDS, VIEW_LAYOUT } from '@proton/shared/lib/constants';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { getContactEmail } from '../../../helpers/addresses';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../../constants';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import RecipientItemSingle from './RecipientItemSingle';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { getHumanLabelID } from '../../../helpers/labels';

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
                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`New message`}</span>
            </DropdownMenuButton>
            {ContactID ? (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={handleClickContact}
                >
                    <Icon name="user" className="mr0-5" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View contact details`}</span>
                </DropdownMenuButton>
            ) : (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={handleClickContact}
                >
                    <Icon name="user-plus" className="mr0-5" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Create new contact`}</span>
                </DropdownMenuButton>
            )}
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={handleClickSearch}
            >
                <Icon name="envelope-magnifying-glass" className="mr0-5" />
                <span className="flex-item-fluid mtauto mbauto">
                    {isRecipient ? c('Action').t`Messages to this recipient` : c('Action').t`Messages from this sender`}
                </span>
            </DropdownMenuButton>
            {showTrustPublicKey && (
                <DropdownMenuButton
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={handleClickTrust}
                >
                    <Icon name="user" className="mr0-5" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Trust public key`}</span>
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
        </>
    );
};

export default MailRecipientItemSingle;
