import { useState } from 'react';

import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import type { RetentionRule } from '@proton/shared/lib/interfaces/RetentionRule';

import RetentionPolicyModal from './RetentionPolicyModal';
import RetentionPolicyTable from './RetentionPolicyTable';
import { useRetentionPoliciesManagement } from './useRetentionPoliciesManagement';

interface Props {
    organization?: Organization;
}

const OrganizationRetentionPoliciesSection = ({ organization }: Props) => {
    const retentionManagement = useRetentionPoliciesManagement(organization);
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const saveRetentionRuleModal = useModalStateObject();

    if (!retentionManagement) {
        return <Loader />;
    }

    const { retentionRules, deleteRetentionRule, loadingRetentionRules } = retentionManagement;
    const selectedRetentionRule = retentionRules.find(({ ID }) => ID === selectedRuleId) ?? null;

    const openCreateRetentionRuleModal = () => {
        setSelectedRuleId(null);
        saveRetentionRuleModal.openModal(true);
    };

    const handleEditRetentionRule = (retentionRule: RetentionRule) => {
        setSelectedRuleId(retentionRule.ID);
        saveRetentionRuleModal.openModal(true);
    };

    const handleModalSuccess = () => {
        setSelectedRuleId(null);
        saveRetentionRuleModal.openModal(false);
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/retention-policies-organization')} inlineLearnMore>
                {c('retention_policy_2025_Info')
                    .t`Create retention rules for how long to keep data in line with your organization's data retention policy. Also enables the automatic purging of expired data.`}
            </SettingsParagraph>

            <RetentionPolicyTable
                rules={retentionRules}
                loading={loadingRetentionRules}
                onEdit={handleEditRetentionRule}
                onDelete={deleteRetentionRule}
                onCreateNew={openCreateRetentionRuleModal}
            />

            {saveRetentionRuleModal.render && (
                <RetentionPolicyModal
                    retentionRule={selectedRetentionRule}
                    retentionPoliciesManagement={retentionManagement}
                    onSuccess={handleModalSuccess}
                    {...saveRetentionRuleModal.modalProps}
                />
            )}
        </SettingsSectionWide>
    );
};

export default OrganizationRetentionPoliciesSection;
