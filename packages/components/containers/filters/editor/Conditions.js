import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Label, Select, Row, Field, ErrorButton, PrimaryButton, ErrorZone } from 'react-components';
import { getI18n as getI18nFilter, newCondition as newConditionModel } from 'proton-shared/lib/filters/factory';
import { noop } from 'proton-shared/lib/helpers/function';

import FilterConditionValues from '../FilterConditionValues';
import RadioContainsAttachements from '../RadioContainsAttachements';

function ConditionsEditor({ filter, onChange = noop, errors = [] }) {
    // Managing ids on the conditions to
    const [currentId, setCurrentId] = useState(1);

    const initIds = (filter) => {
        let id = currentId;
        filter.Simple.Conditions = filter.Simple.Conditions.map((condition) => {
            if (!condition.id) {
                return { ...condition, id: id++ };
            }
            return condition;
        });
        if (id !== currentId) {
            setCurrentId(id);
        }
        return filter;
    };

    const [model, setModel] = useState(initIds(filter));

    const newCondition = () => {
        const condition = newConditionModel();
        condition.id = currentId;
        setCurrentId(currentId + 1);
        return condition;
    };

    const { COMPARATORS, TYPES } = getI18nFilter();
    const toOptions = (list = []) => list.map(({ label: text, value }) => ({ text, value }));

    function syncModel(_value, { scope, condition, index }, newScoped) {
        const newConditions = model.Simple.Conditions.map((item, i) => {
            if (i === index) {
                return {
                    ...condition,
                    [scope]: newScoped
                };
            }
            return item;
        });
        onChange(newConditions);
        setModel({
            ...model,
            Simple: {
                ...model.Simple,
                Conditions: newConditions
            }
        });
    }

    const handleAddNewCondition = () => {
        setModel({
            ...model,
            Simple: {
                ...model.Simple,
                Conditions: model.Simple.Conditions.concat(newCondition())
            }
        });
    };

    const handleRemoveCondition = (index) => () => {
        const Conditions = model.Simple.Conditions.filter((_item, i) => i !== index);
        onChange(Conditions);
        setModel({
            ...model,
            Simple: {
                ...model.Simple,
                Conditions: Conditions.length ? Conditions : [newCondition()]
            }
        });
    };

    const handleChangeAttachments = (config) => (value) => {
        const newComparator = COMPARATORS.find((item) => item.value === value);
        syncModel(value, config, newComparator);
    };

    const handleChangeType = (config) => ({ target }) => {
        const newType = TYPES.find((item) => item.value === target.value);
        syncModel(target.value, config, newType);
    };
    const handleChangeCondition = (config) => ({ target }) => {
        const newComparator = COMPARATORS.find((item) => item.value === target.value);
        syncModel(target.value, config, newComparator);
    };

    const handleDeleteValue = (config) => (index) => {
        const { condition, scope } = config;
        const newScoped = condition[scope].filter((_, i) => i !== index);
        syncModel(null, config, newScoped);
    };

    const handleAddValue = (config) => (value) => {
        const { condition, scope } = config;
        const newScoped = condition[scope].concat(value);
        syncModel(value, config, newScoped);
    };

    const handleEditValue = (config) => ({ index, value }) => {
        const { condition, scope } = config;
        const newScoped = condition[scope].map((existingValue, i) => (i === index ? value : existingValue));
        syncModel(value, config, newScoped);
    };

    const hasError = (key, index) => ((errors[index] || {}).errors || []).includes(key);

    return (
        <>
            {model.Simple.Conditions.map((condition, index) => {
                const n = index + 1;
                return (
                    <Row key={`condition-${condition.id}`}>
                        <Label>{c('Label').t`Conditions ${n}`}</Label>
                        {condition.Type.value === 'attachments' ? (
                            <Field>
                                <Select
                                    onChange={handleChangeType({
                                        scope: 'Type',
                                        condition,
                                        index
                                    })}
                                    className="mb1"
                                    options={toOptions(TYPES)}
                                    defaultValue={condition.Type.value}
                                />

                                <RadioContainsAttachements
                                    comparator={condition.Comparator.value}
                                    onChange={handleChangeAttachments({ scope: 'Comparator', condition, index })}
                                />
                            </Field>
                        ) : (
                            <Field>
                                <div className="mb1">
                                    <Select
                                        options={toOptions(TYPES)}
                                        defaultValue={condition.Type.value}
                                        onChange={handleChangeType({
                                            scope: 'Type',
                                            condition,
                                            index
                                        })}
                                    />

                                    {hasError('type', index) ? (
                                        <ErrorZone id="ActionsError">{c('Error')
                                            .t`You must choose a type of condition`}</ErrorZone>
                                    ) : null}
                                </div>

                                <FilterConditionValues
                                    options={toOptions(COMPARATORS)}
                                    condition={condition}
                                    error={errors[index]}
                                    onChangeCondition={handleChangeCondition({
                                        scope: 'Comparator',
                                        condition,
                                        index
                                    })}
                                    onDelete={handleDeleteValue({ scope: 'Values', condition, index })}
                                    onAdd={handleAddValue({ scope: 'Values', condition, index })}
                                    onEdit={handleEditValue({ scope: 'Values', condition, index })}
                                />
                            </Field>
                        )}
                        {model.Simple.Conditions.length > 1 && (
                            <div className="ml1">
                                <ErrorButton
                                    title={c('Action').t`Remove condition`}
                                    icon="trash"
                                    onClick={handleRemoveCondition(index)}
                                />
                            </div>
                        )}
                    </Row>
                );
            })}

            <Row>
                <span className="pm-label" />
                <PrimaryButton onClick={handleAddNewCondition}>{c('Action').t`Add a new condition`}</PrimaryButton>
            </Row>
        </>
    );
}

ConditionsEditor.propTypes = {
    filter: PropTypes.object.isRequired,
    errors: PropTypes.array,
    onChange: PropTypes.func
};
export default ConditionsEditor;
