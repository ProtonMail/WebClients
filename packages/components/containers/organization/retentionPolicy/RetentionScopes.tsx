import { useEffect, useState } from 'react';
import type { SetStateAction } from 'react';

import { type FormikErrors } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import type { RetentionRuleScopeType } from '@proton/shared/lib/interfaces/RetentionRule';

import RetentionScopeItem from './RetentionScopeItem';
import { PRODUCT_FILTER_OPTIONS } from './constants';
import { generateClientIDForRuleScope } from './helpers';
import type { RetentionRuleFormData } from './types';

interface Props {
    values: RetentionRuleFormData;
    setValues: (
        values: SetStateAction<RetentionRuleFormData>,
        shouldValidate?: boolean
    ) => Promise<void> | Promise<FormikErrors<RetentionRuleFormData>>;
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

const RetentionScopes = ({ values, setValues }: Props) => {
    const [scopeOption, setScopeOption] = useState(
        values.scopes.length > 0 ? RetentionScopeOption.Specific : RetentionScopeOption.All
    );

    useEffect(() => {
        if (values.scopes.length === 0 && scopeOption === RetentionScopeOption.Specific) {
            setScopeOption(RetentionScopeOption.All);
        }
    }, [values.scopes.length, scopeOption]);

    const handleScopeOptionChange = (value: RetentionScopeOption) => {
        setScopeOption(value);
        if (value === RetentionScopeOption.All) {
            void setValues({ ...values, scopes: [] });
        } else {
            const productOptions = PRODUCT_FILTER_OPTIONS[values.products];
            const initialScope = getInitialScope(productOptions);
            void setValues({ ...values, scopes: [initialScope] });
        }
    };

    const handleAddScope = () => {
        const productOptions = PRODUCT_FILTER_OPTIONS[values.products];
        const newScope = getInitialScope(productOptions);
        void setValues({ ...values, scopes: [...values.scopes, newScope] });
    };

    const handleRemoveScope = (id: string) => {
        void setValues({ ...values, scopes: values.scopes.filter((scope) => scope.id !== id) });
    };

    const handleScopeFieldChange = (id: string, field: RetentionRuleScopeType) => {
        void setValues({
            ...values,
            scopes: values.scopes.map((scope) =>
                scope.id === id ? { ...scope, entityType: field, entityID: '' } : scope
            ),
        });
    };

    const handleScopeValueChange = (id: string, value: string) => {
        void setValues({
            ...values,
            scopes: values.scopes.map((scope) => (scope.id === id ? { ...scope, entityID: value } : scope)),
        });
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
                        disableChange={PRODUCT_FILTER_OPTIONS[values.products].length === 0}
                    />
                </div>
                {scopeOption === RetentionScopeOption.Specific && (
                    <>
                        <div className="pl-5">
                            {values.scopes.map((scope) => (
                                <RetentionScopeItem
                                    key={scope.id}
                                    scope={{
                                        id: scope.id,
                                        entityType: scope.entityType,
                                        entityID: scope.entityID,
                                    }}
                                    selectedProduct={values.products}
                                    onRemoveScope={handleRemoveScope}
                                    onScopeFieldChange={handleScopeFieldChange}
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
