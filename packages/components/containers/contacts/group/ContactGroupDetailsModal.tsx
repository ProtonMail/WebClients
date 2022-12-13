import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import { Icon, ModalProps, ModalTwo } from '../../../components';
import ModalContent from '../../../components/modalTwo/ModalContent';
import ModalFooter from '../../../components/modalTwo/ModalFooter';
import ModalHeader from '../../../components/modalTwo/ModalHeader';
import Tooltip from '../../../components/tooltip/Tooltip';
import { useContactEmails, useContactGroups, useUser } from '../../../hooks';
import { ContactExportingProps } from '../modals/ContactExportingModal';
import { ContactGroupDeleteProps } from './ContactGroupDeleteModal';
import { ContactGroupEditProps } from './ContactGroupEditModal';
import ContactGroupTable from './ContactGroupTable';

import './ContactGroupDetailsModal.scss';

export interface ContactGroupDetailsProps {
    contactGroupID: string;
    onEdit: (props: ContactGroupEditProps) => void;
    onDelete: (props: ContactGroupDeleteProps) => void;
    onExport: (props: ContactExportingProps) => void;
    onUpgrade: () => void;
}

type Props = ContactGroupDetailsProps & ModalProps;

const ContactGroupDetailsModal = ({ contactGroupID, onEdit, onDelete, onExport, onUpgrade, ...rest }: Props) => {
    const [user] = useUser();
    const [contactGroups = [], loadingGroups] = useContactGroups();
    const [contactEmails = [], loadingEmails] = useContactEmails() as [ContactEmail[] | undefined, boolean, any];
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

    return (
        <ModalTwo size="large" className="contacts-modal" {...rest}>
            <ModalHeader
                title={
                    <div className="flex flex-nowrap flex-align-items-center">
                        <div
                            className="contact-group-details-chip rounded-50 mr0-5 flex-item-noshrink"
                            style={{ backgroundColor: group?.Color }}
                        />
                        <span className="text-ellipsis" title={group?.Name}>
                            {group?.Name}
                        </span>
                    </div>
                }
            />
            <ModalContent>
                <div className="flex flex-no-min-children flex-item-fluid">
                    <h4 className="mb1 flex flex-align-items-center flex-item-fluid">
                        <Icon className="mr0-5" name="users" />
                        <span>
                            {c('Title').ngettext(msgid`${emailsCount} member`, `${emailsCount} members`, emailsCount)}
                        </span>
                    </h4>
                    <div className="flex-item-noshrink">
                        <Tooltip title={c('Action').t`Export contact group`}>
                            <Button
                                color="weak"
                                shape="outline"
                                icon
                                onClick={handleExportContactGroup}
                                disabled={loading}
                                className="inline-flex ml0-5"
                                data-testid="group-summary:export"
                            >
                                <Icon name="arrow-up-from-square" alt={c('Action').t`Export contact group`} />
                            </Button>
                        </Tooltip>
                        <Tooltip title={c('Action').t`Delete`}>
                            <Button
                                color="weak"
                                shape="outline"
                                icon
                                onClick={handleDelete}
                                disabled={loading}
                                className="inline-flex ml0-5"
                                data-testid="group-summary:delete"
                            >
                                <Icon name="trash" alt={c('Action').t`Delete`} />
                            </Button>
                        </Tooltip>
                        <Tooltip title={c('Action').t`Edit`}>
                            <Button
                                icon
                                shape="solid"
                                color="norm"
                                onClick={handleEdit}
                                disabled={loading}
                                className="inline-flex ml0-5"
                                data-testid="group-summary:edit"
                            >
                                <Icon name="pen" alt={c('Action').t`Edit`} />
                            </Button>
                        </Tooltip>
                    </div>
                </div>
                <ContactGroupTable contactEmails={emails} />
            </ModalContent>
            <ModalFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={() => handleEdit()} disabled={loading}>
                    {c('Action').t`Edit`}
                </Button>
            </ModalFooter>
        </ModalTwo>
    );
};

export default ContactGroupDetailsModal;
