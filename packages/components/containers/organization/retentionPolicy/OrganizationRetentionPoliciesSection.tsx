import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';

import RetentionPolicyTable from './RetentionPolicyTable';
import { useRetentionPoliciesManagement } from './useRetentionPoliciesManagement';

interface Props {
    organization?: Organization;
}

const OrganizationRetentionPoliciesSection = ({ organization }: Props) => {
    const retentionManagement = useRetentionPoliciesManagement(organization);

    if (!retentionManagement) {
        return <Loader />;
    }
    const { retentionRules, deleteRetentionRule, loadingRetentionRules } = retentionManagement;

    const openCreateRetentionRuleModal = () => {
        // TODO
    };

    const handleEditRetentionRule = () => {
        // TODO
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/retention-policies-organization')} inlineLearnMore>
                {c('RetentionPoliciesSettings')
                    .t`Create retention rules for how long to keep data in line with your organization's data retention policy. Also enables the automatic purging of expired data.`}
            </SettingsParagraph>

            <RetentionPolicyTable
                rules={retentionRules}
                loading={loadingRetentionRules}
                onEdit={handleEditRetentionRule}
                onDelete={deleteRetentionRule}
                onCreateNew={openCreateRetentionRuleModal}
            />
        </SettingsSectionWide>
    );
};

export default OrganizationRetentionPoliciesSection;
