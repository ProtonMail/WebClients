import { useState } from 'react';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import Autocomplete from '@proton/components/components/autocomplete/Autocomplete';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { RetentionRuleProduct } from '@proton/shared/lib/interfaces/RetentionRule';
import type { RetentionRuleScopeType } from '@proton/shared/lib/interfaces/RetentionRule';

import { PRODUCT_FILTER_OPTIONS } from './constants';
import type { RetentionRuleScopeFormData } from './types';
import { type AutocompleteOption, useRetentionRuleScopeSuggestion } from './useRetentionRuleScopeSuggestion';

interface Props {
    scope: RetentionRuleScopeFormData;
    selectedProduct: RetentionRuleProduct;
    onRemoveScope: (id: string) => void;
    onScopeFieldChange: (id: string, field: RetentionRuleScopeType) => void;
    onScopeValueChange: (id: string, value: string) => void;
}

const RetentionScopeItem = ({
    scope,
    selectedProduct,
    onRemoveScope,
    onScopeFieldChange,
    onScopeValueChange,
}: Props) => {
    const { getScopeFieldLabel, getAutocompleteOptions, getScopeValueLabel } = useRetentionRuleScopeSuggestion();

    const [autocompleteValue, setAutocompleteValue] = useState(getScopeValueLabel(scope.entityID, scope.entityType));

    const onChange = (value: string) => {
        setAutocompleteValue(value);
        onScopeValueChange(scope.id, value);
    };

    const onSelect = ({ label: displayValue, id }: AutocompleteOption) => {
        setAutocompleteValue(displayValue);
        onScopeValueChange(scope.id, id);
    };

    const onFieldChange = ({ value }: { value: RetentionRuleScopeType }) => {
        onScopeFieldChange(scope.id, value);
        setAutocompleteValue('');
    };

    return (
        <div className="flex gap-2 m-2">
            <div className="w-1/3">
                {PRODUCT_FILTER_OPTIONS[selectedProduct] && (
                    <SelectTwo value={scope.entityType} onChange={onFieldChange}>
                        {PRODUCT_FILTER_OPTIONS[selectedProduct].map((option) => (
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
                    options={getAutocompleteOptions(scope.entityType)}
                    getData={(option: AutocompleteOption) => option.label}
                    placeholder={c('retention_policy_2025_Placeholder').t`Enter value`}
                />
            </div>
            <div className="shrink-0 w-custom" style={{ '--w-custom': '3em' }}>
                <Tooltip title={c('retention_policy_2025_Action').t`Delete this scope`}>
                    <Button className="ml-auto flex" shape="ghost" onClick={() => onRemoveScope(scope.id)} icon>
                        <Icon name="trash" alt={c('retention_policy_2025_Action').t`Delete this scope`} />
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};

export default RetentionScopeItem;
