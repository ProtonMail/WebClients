import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import SearchInput from '@proton/components/components/input/SearchInput';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { RetentionRule } from '@proton/shared/lib/interfaces/RetentionRule';
import clsx from '@proton/utils/clsx';

import RetentionPolicyTableRow from './RetentionPolicyTableRow';
import { getActionLabel, getDaysStringFromLifetime } from './helpers';
import { useRetentionRuleScopeSuggestion } from './useRetentionRuleScopeSuggestion';

interface RetentionPolicyTableProps {
    rules: RetentionRule[];
    loading: boolean;
    onEdit: (rule: RetentionRule) => void;
    onDelete: (rule: RetentionRule) => void;
    onCreateNew: () => void;
}

const RetentionPolicyTable = ({ rules, loading, onEdit, onDelete, onCreateNew }: RetentionPolicyTableProps) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const { getFullScopeLabel } = useRetentionRuleScopeSuggestion();

    const filteredRules = useMemo(() => {
        if (!searchKeyword) {
            return rules;
        }

        const normalizedWords = normalize(searchKeyword, true);
        return rules.filter((rule) => {
            if (normalize(rule.Name, true).includes(normalizedWords)) {
                return true;
            }

            const scopeMatch = rule.Scopes.some((scope) => {
                const fullScopeLabel = getFullScopeLabel(scope);
                return normalize(fullScopeLabel, true).includes(normalizedWords);
            });
            if (scopeMatch) {
                return true;
            }

            const lifetimeText =
                rule.Lifetime === null
                    ? c('retention_policy_2025_Info').t`Forever`
                    : getDaysStringFromLifetime(rule.Lifetime);
            if (normalize(lifetimeText, true).includes(normalizedWords)) {
                return true;
            }

            const actionMatch = normalize(getActionLabel(rule.Action), true).includes(normalizedWords);
            return actionMatch;
        });
    }, [rules, searchKeyword, getFullScopeLabel]);

    const hasPolicies = filteredRules.length > 0;

    return (
        <>
            <div className="mb-4 flex items-center gap-4">
                <Button color="norm" data-testid="retention-policies:create-policy" onClick={onCreateNew}>{c(
                    'retention_policy_2025_Action'
                ).t`Create retention rule`}</Button>
                <div className="ml-0 lg:ml-auto w-full lg:w-custom" style={{ '--lg-w-custom': '24em' }}>
                    <SearchInput
                        onChange={(value: string) => setSearchKeyword(value)}
                        placeholder={c('retention_policy_2025_Placeholder').t`Search for rule, users, period, action`}
                        value={searchKeyword}
                        aria-label={c('retention_policy_2025_Placeholder').t`Search policies`}
                    />
                </div>
            </div>

            <Table className={clsx(!loading && hasPolicies && 'simple-table--has-actions')}>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell className="w-1/10"></TableHeaderCell>
                        <TableHeaderCell className="w-2/10">{c('retention_policy_2025_TableHeader')
                            .t`Retention Rule`}</TableHeaderCell>
                        <TableHeaderCell className="w-2/10">{c('retention_policy_2025_TableHeader')
                            .t`Applies to`}</TableHeaderCell>
                        <TableHeaderCell className="w-2/10">{c('retention_policy_2025_TableHeader')
                            .t`Retention period`}</TableHeaderCell>
                        <TableHeaderCell className="w-2/10">{c('retention_policy_2025_TableHeader')
                            .t`Action`}</TableHeaderCell>
                        <TableHeaderCell></TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody colSpan={6} loading={loading}>
                    {filteredRules.map((rule) => (
                        <RetentionPolicyTableRow
                            key={rule.ID}
                            rule={rule}
                            loading={loading}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                    {!loading && !hasPolicies && (
                        <tr>
                            <td colSpan={6} className="text-center">
                                <i>{c('retention_policy_2025_TableRow').t`No retention policies found`}</i>
                            </td>
                        </tr>
                    )}
                </TableBody>
            </Table>
        </>
    );
};

export default RetentionPolicyTable;
