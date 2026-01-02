import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import type { RetentionRuleProduct, RetentionRuleScopeType } from '@proton/shared/lib/interfaces/RetentionRule';

import RetentionScopeItem from './RetentionScopeItem';
import { PRODUCT_FILTER_OPTIONS } from './constants';
import { generateClientIDForRuleScope } from './helpers';
import type { RetentionRuleScopeFormData } from './types';

interface Props {
    products: RetentionRuleProduct;
    value: RetentionRuleScopeFormData[];
    onChange: (newValue: RetentionRuleScopeFormData[]) => void;
}

enum RetentionScopeOption {
    All = 0,
    Specific = 1,
}

const getInitialScope = (productOptions: RetentionRuleScopeType[]) => {
    if (productOptions.length === 0) {
        throw new Error('No product options found');
    }

    return {
        id: generateClientIDForRuleScope(),
        entityType: productOptions[0],
        entityID: '',
    };
};

const RetentionScopes = ({ products, value, onChange }: Props) => {
    const [scopeOption, setScopeOption] = useState(
        value.length > 0 ? RetentionScopeOption.Specific : RetentionScopeOption.All
    );

    const productOptions = PRODUCT_FILTER_OPTIONS[products];

    useEffect(() => {
        if (value.length === 0 && scopeOption === RetentionScopeOption.Specific) {
            setScopeOption(RetentionScopeOption.All);
        }
    }, [value.length, scopeOption]);

    const handleScopeOptionChange = (value: RetentionScopeOption) => {
        setScopeOption(value);
        if (value === RetentionScopeOption.All) {
            onChange([]);
        } else {
            const initialScope = getInitialScope(productOptions);
            onChange([initialScope]);
        }
    };

    const handleAddScope = () => {
        const newScope = getInitialScope(productOptions);
        onChange([...value, newScope]);
    };

    const handleRemoveScope = (id: string) => {
        onChange(value.filter((scope: RetentionRuleScopeFormData) => scope.id !== id));
    };

    const handleScopeTypeChange = (id: string, field: RetentionRuleScopeType) => {
        onChange(
            value.map((scope: RetentionRuleScopeFormData) =>
                scope.id === id ? { ...scope, entityType: field, entityID: '' } : scope
            )
        );
    };

    const handleScopeValueChange = (id: string, field: string) => {
        const index = value.findIndex((scope: RetentionRuleScopeFormData) => scope.id === id);
        if (index !== -1) {
            const newScope = { ...value[index], entityID: field };
            onChange([...value.slice(0, index), newScope, ...value.slice(index + 1)]);
        }
    };

    return (
        <>
            <div className="mt-4">
                <label className="text-semibold block mb-2">{c('retention_policy_2025_Label').t`Applies to`}</label>
                <div className="flex flex-column justify-start items-start">
                    <RadioGroup
                        name="scope-option"
                        value={scopeOption}
                        onChange={handleScopeOptionChange}
                        className="*:self-start"
                        options={[
                            {
                                value: RetentionScopeOption.All,
                                label: c('retention_policy_2025_Option').t`Everyone in organization`,
                            },
                            {
                                value: RetentionScopeOption.Specific,
                                label: c('retention_policy_2025_Option').t`Specific users or groups`,
                            },
                        ]}
                        disableChange={productOptions.length === 0}
                    />
                </div>
                {scopeOption === RetentionScopeOption.Specific && (
                    <>
                        <div className="pl-5">
                            {value.map((scope) => (
                                <RetentionScopeItem
                                    key={scope.id}
                                    scope={scope}
                                    selectedProduct={products}
                                    onRemoveScope={handleRemoveScope}
                                    onScopeTypeChange={handleScopeTypeChange}
                                    onScopeValueChange={handleScopeValueChange}
                                />
                            ))}
                            <Button onClick={handleAddScope} shape="underline" color="norm" className="pl-2 pt-0">
                                {c('retention_policy_2025_Action').t`Add users or groups`}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default RetentionScopes;
