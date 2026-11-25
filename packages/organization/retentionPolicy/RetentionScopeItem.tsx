import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Autocomplete from '@proton/components/components/autocomplete/Autocomplete';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import type { RetentionRuleProduct, RetentionRuleScopeType } from '@proton/shared/lib/interfaces/RetentionRule';

import { PRODUCT_FILTER_OPTIONS } from './constants';
import type { RetentionRuleScopeFormData } from './types';
import { type AutocompleteOption, useRetentionRuleScopeSuggestion } from './useRetentionRuleScopeSuggestion';

interface Props {
    scope: RetentionRuleScopeFormData;
    selectedProduct: RetentionRuleProduct;
    onRemoveScope: (id: string) => void;
    onScopeTypeChange: (id: string, field: RetentionRuleScopeType) => void;
    onScopeValueChange: (id: string, value: string) => void;
}

const RetentionScopeItem = ({
    scope,
    selectedProduct,
    onRemoveScope,
    onScopeTypeChange,
    onScopeValueChange,
}: Props) => {
    const { getScopeFieldLabel, getAutocompleteOptions, getScopeValueLabel } = useRetentionRuleScopeSuggestion();

    const [autocompleteValue, setAutocompleteValue] = useState(getScopeValueLabel(scope.entityID, scope.entityType));

    const autocompleteOptions = useMemo(() => getAutocompleteOptions(scope.entityType), [scope.entityType]);

    const onChange = (value: string) => {
        setAutocompleteValue(value);
        const option = autocompleteOptions.find((option) => option.label === value);
        onScopeValueChange(scope.id, option?.id ?? '');
    };

    const onSelect = ({ label: displayValue, id }: AutocompleteOption) => {
        setAutocompleteValue(displayValue);
        onScopeValueChange(scope.id, id);
    };

    const onFieldChange = ({ value }: { value: RetentionRuleScopeType }) => {
        onScopeTypeChange(scope.id, value);
        setAutocompleteValue('');
    };

    const invalidValue = autocompleteOptions.find((option) => option.id === scope.entityID) == null;
    const selectedProductOption = PRODUCT_FILTER_OPTIONS[selectedProduct];

    return (
        <div className="flex gap-2 m-2">
            <div className="w-1/3">
                {selectedProductOption && (
                    <SelectTwo value={scope.entityType} onChange={onFieldChange}>
                        {selectedProductOption.map((option) => (
                            <Option key={option} value={option} title={getScopeFieldLabel(option)} />
                        ))}
                    </SelectTwo>
                )}
            </div>
            <div className="flex-1">
                <Autocomplete
                    id={`scope-value-${scope.id}`}
                    value={autocompleteValue}
                    onChange={onChange}
                    onSelect={onSelect}
                    options={autocompleteOptions}
                    getData={(option: AutocompleteOption) => option.label}
                    placeholder={c('retention_policy_2025_Placeholder').t`Enter value`}
                    showHiddenResultsHint
                    error={invalidValue ? c('retention_policy_2025_Error').t`Invalid value` : undefined}
                />
            </div>
            <div className="shrink-0 w-custom" style={{ '--w-custom': '3em' }}>
                <Tooltip title={c('retention_policy_2025_Action').t`Delete this scope`}>
                    <Button className="ml-auto flex" shape="ghost" onClick={() => onRemoveScope(scope.id)} icon>
                        <IcTrash alt={c('retention_policy_2025_Action').t`Delete this scope`} />
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};

export default RetentionScopeItem;
