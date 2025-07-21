import { c, msgid } from 'ttag';

import { Tooltip } from '@proton/atoms';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Logo from '@proton/components/components/logo/Logo';
import TableRow from '@proton/components/components/table/TableRow';
import type { RetentionRule, RetentionRuleScope } from '@proton/shared/lib/interfaces/RetentionRule';
import isTruthy from '@proton/utils/isTruthy';

import { getActionLabel, getLogoProductLabel } from './helpers';
import { useRetentionRuleScopeSuggestion } from './useRetentionRuleScopeSuggestion';

interface RetentionPolicyTableRowProps {
    rule: RetentionRule;
    loading: boolean;
    onEdit: (policy: RetentionRule) => void;
    onDelete: (policy: RetentionRule) => void;
}

const RetentionPolicyTableRow = ({ rule, loading, onEdit, onDelete }: RetentionPolicyTableRowProps) => {
    const { getFullScopeLabel } = useRetentionRuleScopeSuggestion();

    const renderVisibleScopeList = (scopes: RetentionRuleScope[]) => {
        return scopes.map((scope) => {
            const labelText = getFullScopeLabel(scope);

            return (
                <div
                    key={`${scope.EntityType}-${scope.EntityID}`}
                    className="text-ellipsis max-w-full inline-block"
                    title={labelText}
                >
                    {labelText}
                </div>
            );
        });
    };

    const renderScope = (rule: RetentionRule) => {
        if (!rule.Scopes?.length) {
            return <span>All users</span>;
        }

        const remainingCount = rule.Scopes.length - 2;

        const getTooltip = (scopes: RetentionRuleScope[]) => {
            return (
                <Tooltip openDelay={100} title={scopes.map(getFullScopeLabel).join('\n')}>
                    <span className="color-primary cursor-help">
                        {c('retention_policy_2025_Info').t`${remainingCount} more`}
                    </span>
                </Tooltip>
            );
        };

        return (
            <div className="flex flex-column gap-1">
                {renderVisibleScopeList(rule.Scopes.slice(0, 2))}
                {remainingCount > 0 && getTooltip(rule.Scopes.slice(2))}
            </div>
        );
    };

    return (
        <TableRow
            key={rule.ID}
            cells={[
                <Logo appName={getLogoProductLabel(rule.Products)} variant="glyph-only" />,
                <span className="text-ellipsis max-w-full inline-block" title={rule.Name}>
                    {rule.Name}
                </span>,
                renderScope(rule),
                <span>
                    {rule.Lifetime === null
                        ? c('retention_policy_2025_Info').t`Forever`
                        : c('retention_policy_2025_Info').ngettext(
                              msgid`${rule.Lifetime} day`,
                              `${rule.Lifetime} days`,
                              rule.Lifetime
                          )}
                </span>,
                <span>{rule.Lifetime === null ? '-' : getActionLabel(rule.Action)}</span>,
                <DropdownActions
                    size="small"
                    list={[
                        {
                            key: 'edit',
                            text: c('retention_policy_2025_Action').t`Edit`,
                            'aria-label': `${c('retention_policy_2025_Action').t`Edit`} ${rule.Name}`,
                            disabled: loading,
                            onClick: () => onEdit(rule),
                        },
                        {
                            key: 'delete',
                            text: c('retention_policy_2025_Action').t`Delete rule`,
                            'aria-label': `${c('retention_policy_2025_Action').t`Delete`} ${rule.Name}`,
                            actionType: 'delete',
                            onClick: () => onDelete(rule),
                            disabled: loading,
                        },
                    ]}
                />,
            ].filter(isTruthy)}
        />
    );
};

export default RetentionPolicyTableRow;
