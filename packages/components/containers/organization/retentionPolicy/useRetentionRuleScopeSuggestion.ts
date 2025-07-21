import { useMemo } from 'react';

import { c } from 'ttag';

import { useGroups } from '@proton/account/groups/hooks';
import { useMembers } from '@proton/account/members/hooks';
import { type RetentionRuleScope, RetentionRuleScopeType } from '@proton/shared/lib/interfaces/RetentionRule';

import type { RetentionRuleScopeFormData } from './types';

export interface AutocompleteOption {
    id: string;
    label: string;
}

export const useRetentionRuleScopeSuggestion = () => {
    const [members] = useMembers();
    const [groups] = useGroups();

    const memberLookup = useMemo(() => {
        const map = new Map<string, string>();
        members?.forEach((member) => {
            map.set(member.ID, member.Name);
        });
        return map;
    }, [members]);

    const groupLookup = useMemo(() => {
        const map = new Map<string, string>();
        groups?.forEach((group) => {
            map.set(group.ID, group.Name);
        });
        return map;
    }, [groups]);

    const getScopeValueLabel = (id: string, entityType: RetentionRuleScopeType): string => {
        const lookup = {
            [RetentionRuleScopeType.User]: memberLookup,
            [RetentionRuleScopeType.Group]: groupLookup,
        };

        return lookup[entityType].get(id) ?? id;
    };

    const getScopeFieldLabel = (scopeType: RetentionRuleScopeType) => {
        if (scopeType === RetentionRuleScopeType.User) {
            return c('Option').t`User`;
        }
        return c('Option').t`Group`;
    };

    const getFullScopeLabel = (scope: RetentionRuleScope): string => {
        return `${getScopeFieldLabel(scope.EntityType)}: ${getScopeValueLabel(scope.EntityID, scope.EntityType)}`;
    };

    const getAutocompleteOptions = (entityType: RetentionRuleScopeType): AutocompleteOption[] => {
        if (entityType === RetentionRuleScopeType.User) {
            return (
                members?.map((member) => ({
                    id: member.ID,
                    label: member.Name,
                })) ?? []
            );
        }

        if (entityType === RetentionRuleScopeType.Group) {
            return (
                groups?.map((group) => ({
                    id: group.ID,
                    label: group.Name,
                })) ?? []
            );
        }
        return [];
    };

    const validateScopeValue = (scope: RetentionRuleScopeFormData): boolean => {
        if (scope.entityType === RetentionRuleScopeType.User) {
            return !!members?.find((member) => member.ID === scope.entityID);
        }

        if (scope.entityType === RetentionRuleScopeType.Group) {
            return !!groups?.find((group) => group.ID === scope.entityID);
        }
        return false;
    };

    const validateScopes = (scopes: RetentionRuleScopeFormData[]): boolean => {
        return scopes.every(validateScopeValue);
    };

    return {
        getScopeValueLabel,
        getScopeFieldLabel,
        getFullScopeLabel,
        getAutocompleteOptions,
        validateScopeValue,
        validateScopes,
    };
};
