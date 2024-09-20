import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import type { Recipient } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import ModalContent from '../../../components/modalTwo/ModalContent';
import ModalFooter from '../../../components/modalTwo/ModalFooter';
import ModalHeader from '../../../components/modalTwo/ModalHeader';
import { useContactEmails, useContactGroups, useUser } from '../../../hooks';
import type { ContactExportingProps } from '../modals/ContactExportingModal';
import RecipientDropdownItem from '../view/RecipientDropdownItem';
import type { ContactGroupDeleteProps } from './ContactGroupDeleteModal';
import type { ContactGroupEditProps } from './ContactGroupEditModal';

import './ContactGroupDetailsModal.scss';

export interface ContactGroupDetailsProps {
    contactGroupID: string;
    onEdit: (props: ContactGroupEditProps) => void;
    onDelete: (props: ContactGroupDeleteProps) => void;
    onExport: (props: ContactExportingProps) => void;
    onUpgrade: () => void;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onCloseContactDetailsModal?: () => void;
}

type Props = ContactGroupDetailsProps & ModalProps;

const ContactGroupDetailsModal = ({
    contactGroupID,
    onEdit,
    onDelete,
    onExport,
    onUpgrade,
    onCompose,
    onCloseContactDetailsModal,
    ...rest
}: Props) => {
    const [user] = useUser();
    const [contactGroups = [], loadingGroups] = useContactGroups();
    const [contactEmails = [], loadingEmails] = useContactEmails();
    const loading = loadingGroups || loadingEmails;
    const group = contactGroups.find(({ ID }) => ID === contactGroupID);
    const emails = contactEmails.filter(({ LabelIDs = [] }: { LabelIDs: string[] }) =>
        LabelIDs.includes(contactGroupID)
    );
    const emailsCount = emails.length;

    const handleEdit = () => {
        if (!user.hasPaidMail) {
            onUpgrade();
            return;
        }
        onEdit({ contactGroupID });
        rest.onClose?.();
    };

    const handleDelete = () => {
        onDelete({ groupIDs: [contactGroupID] });
        rest.onClose?.();
    };

    const handleExportContactGroup = () => {
        onExport({ contactGroupID });
    };

    const handleCompose = () => {
        if (onCompose) {
            const recipients = emails.map((email) => ({ Name: email.Name, Address: email.Email }));
            onCompose([...recipients], []);
            rest.onClose?.();
            onCloseContactDetailsModal?.();
        }
    };

    const handleComposeSingle = (recipient: Recipient) => {
        if (onCompose) {
            onCompose([recipient], []);
            rest.onClose?.();
            onCloseContactDetailsModal?.();
        }
    };

    const getComposeAction = (recipient: Recipient) => {
        return (
            onCompose && (
                <div className="mr-2">
                    <Tooltip title={c('Action').t`Compose`}>
                        <Button color="weak" shape="ghost" icon onClick={() => handleComposeSingle(recipient)}>
                            <Icon name="pen-square" alt={c('Action').t`Compose`} />
                        </Button>
                    </Tooltip>
                </div>
            )
        );
    };

    return (
        <ModalTwo size="large" className="contacts-modal" {...rest}>
            <ModalHeader
                title={
                    <div className="flex flex-nowrap items-center gap-2">
                        <span
                            style={{ backgroundColor: group?.Color ?? '', '--w-custom': '2.125rem' }}
                            className="rounded w-custom text-center shrink-0"
                        >
                            <Icon color="white" name="users" />
                        </span>
                        <span className="text-ellipsis" title={group?.Name}>
                            {group?.Name}
                        </span>
                    </div>
                }
                actions={[
                    <Tooltip title={c('Action').t`Edit`}>
                        <Button
                            icon
                            shape="ghost"
                            color="weak"
                            onClick={handleEdit}
                            disabled={loading}
                            className="inline-flex ml-2"
                            data-testid="group-summary:edit"
                        >
                            <Icon name="pen" alt={c('Action').t`Edit`} />
                        </Button>
                    </Tooltip>,
                    <Tooltip title={c('Action').t`Export contact group`}>
                        <Button
                            color="weak"
                            shape="ghost"
                            icon
                            onClick={handleExportContactGroup}
                            disabled={loading}
                            className="inline-flex ml-2"
                            data-testid="group-summary:export"
                        >
                            <Icon name="arrow-up-from-square" alt={c('Action').t`Export contact group`} />
                        </Button>
                    </Tooltip>,
                    <Tooltip title={c('Action').t`Delete`}>
                        <Button
                            color="weak"
                            shape="ghost"
                            icon
                            onClick={handleDelete}
                            disabled={loading}
                            className="inline-flex ml-2"
                            data-testid="group-summary:delete"
                        >
                            <Icon name="trash" alt={c('Action').t`Delete`} />
                        </Button>
                    </Tooltip>,
                ]}
            />
            <ModalContent>
                <h4 className="mb-4 color-weak text-lg">
                    {c('Title').ngettext(
                        msgid`${emailsCount} email address`,
                        `${emailsCount} email addresses`,
                        emailsCount
                    )}
                </h4>
                {emails.map((email) => {
                    const recipient: Recipient = { Name: email.Name, Address: email.Email };
                    return (
                        <RecipientDropdownItem
                            label={recipient.Name}
                            recipient={recipient}
                            displaySenderImage={false}
                            closeDropdown={noop}
                            additionalAction={getComposeAction(recipient)}
                            simple
                            key={email.Email}
                        />
                    );
                })}
            </ModalContent>
            <ModalFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                {onCompose && (
                    <Button
                        color="norm"
                        onClick={handleCompose}
                        disabled={loading}
                        className="inline-flex justify-center"
                    >
                        <Icon name="pen-square" className="self-center mr-2" alt={c('Action').t`New message`} />
                        {c('Action').t`New message`}
                    </Button>
                )}
            </ModalFooter>
        </ModalTwo>
    );
};

export default ContactGroupDetailsModal;
