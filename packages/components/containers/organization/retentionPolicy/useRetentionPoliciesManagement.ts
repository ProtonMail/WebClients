import { c } from 'ttag';

import { addRetentionRule, deleteRetentionRule, updateRetentionRule } from '@proton/account/retentionPolicies';
import { useRetentionPolicies } from '@proton/account/retentionPolicies/hooks';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store';
import {
    createRetentionRuleApi,
    deleteRetentionRuleApi,
    updateRetentionRuleApi,
} from '@proton/shared/lib/api/retentionPolicies';
import type { RetentionRulePayload } from '@proton/shared/lib/api/retentionPolicies';
import type { Organization } from '@proton/shared/lib/interfaces';
import type { RetentionRule } from '@proton/shared/lib/interfaces/RetentionRule';

import { isClientIDRuleScope } from './helpers';
import type { RetentionRuleFormData } from './types';

export interface RetentionPoliciesManagementReturn {
    retentionRules: RetentionRule[];
    loadingRetentionRules: boolean;
    deleteRetentionRule: (retentionRule: RetentionRule) => Promise<void>;
    editRetentionRule: (formData: RetentionRuleFormData) => Promise<void>;
    createRetentionRule: (formData: RetentionRuleFormData) => Promise<void>;
}

export const useRetentionPoliciesManagement = (
    organization?: Organization
): RetentionPoliciesManagementReturn | undefined => {
    const handleError = useErrorHandler();
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [retentionRules, loadingRetentionRules] = useRetentionPolicies();

    if (loadingRetentionRules || !retentionRules || !organization) {
        return undefined;
    }

    const onDeleteRetentionRule = async (retentionRule: RetentionRule) => {
        try {
            await api(deleteRetentionRuleApi(retentionRule.ID));
            dispatch(deleteRetentionRule(retentionRule.ID));
            createNotification({
                type: 'success',
                text: c('Info').t`Retention rule "${retentionRule.Name}" deleted successfully`,
            });
        } catch (error) {
            handleError(error);
        }
    };

    const onEditRetentionRule = async (formData: RetentionRuleFormData) => {
        if (formData.id === null) {
            throw new Error('Retention rule ID is required');
        }

        const payload: RetentionRulePayload = {
            Name: formData.name,
            Products: formData.products,
            Lifetime: formData.lifetime,
            Action: formData.action,
            Scopes: formData.scopes.map((scope) => ({
                ID: isClientIDRuleScope(scope.id) ? null : scope.id,
                EntityType: scope.entityType,
                EntityID: scope.entityID,
            })),
        };

        try {
            const { RetentionRule } = await api<{ RetentionRule: RetentionRule }>(
                updateRetentionRuleApi(formData.id, payload)
            );
            dispatch(updateRetentionRule(RetentionRule));
            createNotification({
                type: 'success',
                text: c('Info').t`Retention rule "${formData.name}" updated successfully`,
            });
        } catch (error) {
            handleError(error);
        }
    };

    const onCreateRetentionRule = async (formData: RetentionRuleFormData) => {
        const payload: RetentionRulePayload = {
            Name: formData.name,
            Products: formData.products,
            Lifetime: formData.lifetime,
            Action: formData.action,
            Scopes: formData.scopes.map((scope) => ({
                ID: null,
                EntityType: scope.entityType,
                EntityID: scope.entityID,
            })),
        };

        try {
            const { RetentionRule } = await api<{ RetentionRule: RetentionRule }>(createRetentionRuleApi(payload));
            dispatch(addRetentionRule(RetentionRule));
            createNotification({
                type: 'success',
                text: c('Info').t`Retention rule "${payload.Name}" created successfully`,
            });
        } catch (error) {
            handleError(error);
        }
    };

    return {
        retentionRules,
        loadingRetentionRules,
        deleteRetentionRule: onDeleteRetentionRule,
        editRetentionRule: onEditRetentionRule,
        createRetentionRule: onCreateRetentionRule,
    };
};
