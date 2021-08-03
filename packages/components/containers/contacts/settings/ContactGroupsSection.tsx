import { c } from 'ttag';

import { Button, ContactUpgradeModal } from '../../../components';
import { useModals, useUser } from '../../../hooks';

import ContactGroupModal from '../modals/ContactGroupModal';
import ContactGroupsTable from '../ContactGroupsTable';

import { SettingsSection, SettingsParagraph } from '../../account';

const ContactGroupsSection = () => {
    const { createModal } = useModals();
    const [user] = useUser();

    const showUpgradeModal = () => createModal(<ContactUpgradeModal />);

    const handleCreate = () => {
        if (!user.hasPaidMail) {
            showUpgradeModal();
            return;
        }
        createModal(<ContactGroupModal selectedContactEmails={[]} />);
    };

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`A group can contain multiple email addresses from the same contact. Please note that a sending limit may apply and prevent you from sending emails to excessively large groups.`}
            </SettingsParagraph>
            <div className="mb1">
                <Button color="norm" onClick={handleCreate}>{c('Action').t`Add group`}</Button>
            </div>
            <ContactGroupsTable hasPaidMail={user.hasPaidMail} showUpgradeModal={showUpgradeModal} />
        </SettingsSection>
    );
};

export default ContactGroupsSection;
