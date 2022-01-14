import { c, msgid } from 'ttag';

import { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';
import { noop } from '@proton/shared/lib/helpers/function';

import { FormModal, Icon, TitleModal, Button } from '../../../components';
import { useContactEmails, useContactGroups, useModals, useUser, useUserKeys } from '../../../hooks';
import './ContactGroupDetailsModal.scss';
import Tooltip from '../../../components/tooltip/Tooltip';
import ContactGroupTable from '../ContactGroupTable';
import ContactUpgradeModal from '../ContactUpgradeModal';
import ContactGroupDeleteModal from './ContactGroupDeleteModal';
import ContactGroupModal from './ContactGroupModal';
import ExportModal from '../settings/ExportModal';

interface Props {
    contactGroupID: string;
    onClose?: () => void;
}

const ContactGroupDetailsModal = ({ contactGroupID, onClose = noop, ...rest }: Props) => {
    const { createModal } = useModals();
    const [user] = useUser();
    const [contactGroups = [], loadingGroups] = useContactGroups();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [contactEmails = [], loadingEmails] = useContactEmails() as [ContactEmail[] | undefined, boolean, any];
    const loading = loadingGroups || loadingEmails || loadingUserKeys;
    const group = contactGroups.find(({ ID }) => ID === contactGroupID);
    const emails = contactEmails.filter(({ LabelIDs = [] }: { LabelIDs: string[] }) =>
        LabelIDs.includes(contactGroupID)
    );
    const emailsCount = emails.length;

    const handleEdit = () => {
        if (!user.hasPaidMail) {
            createModal(<ContactUpgradeModal />);
            return;
        }
        createModal(<ContactGroupModal contactGroupID={contactGroupID} />);
        onClose();
    };

    const handleDelete = () => {
        createModal(<ContactGroupDeleteModal groupIDs={[contactGroupID]} />);
        onClose();
    };

    const handleExportContactGroup = () =>
        createModal(<ExportModal contactGroupID={contactGroupID} userKeysList={userKeysList} />);

    return (
        <FormModal
            onSubmit={handleEdit}
            loading={loading}
            close={c('Action').t`Close`}
            submit={c('Action').t`Edit`}
            modalTitleID="contact-group-details-modal"
            title={
                <TitleModal id="contact-group-details-modal" className="flex flex-nowrap flex-align-items-center">
                    <div
                        className="contact-group-details-chip rounded-50 mr0-5 flex-item-noshrink"
                        style={{ backgroundColor: group?.Color }}
                    />
                    <span className="text-ellipsis" title={group?.Name}>
                        {group?.Name}
                    </span>
                </TitleModal>
            }
            onClose={onClose}
            {...rest}
        >
            <div className="flex flex-no-min-children flex-item-fluid">
                <h4 className="mb1 flex flex-align-items-center flex-item-fluid">
                    <Icon className="mr0-5" name="user-group" />
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
                        >
                            <Icon name="arrow-up-from-screen" alt={c('Action').t`Export contact group`} />
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
                        >
                            <Icon name="pen" alt={c('Action').t`Edit`} />
                        </Button>
                    </Tooltip>
                </div>
            </div>
            <ContactGroupTable contactEmails={emails} />
        </FormModal>
    );
};

export default ContactGroupDetailsModal;
