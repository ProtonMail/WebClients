import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Label, Icon, Select, Row, SmallButton, PrimaryButton, ErrorZone } from 'react-components';
import { getI18n as getI18nFilter, newCondition } from 'proton-shared/lib/filters/factory';
import { noop } from 'proton-shared/lib/helpers/function';

import FilterConditionValues from '../FilterConditionValues';
import RadioContainsAttachements from '../RadioContainsAttachements';

function ConditionsEditor({ filter, onChange, errors }) {
    const [model, setModel] = useState(filter);

    const { COMPARATORS, TYPES } = getI18nFilter();
    const toOptions = (list = []) => list.map(({ label: text, value }) => ({ text, value }));

    function syncModel(value, { scope, condition, index }, newScoped) {
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
        const Conditions = model.Simple.Conditions.filter((item, i) => i !== index);
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

    const handleDeleteValue = (config) => (value) => {
        const { condition, scope } = config;
        const newScoped = condition[scope].filter((val) => val !== value);
        syncModel(value, config, newScoped);
    };

    const handleAddValue = (config) => (value) => {
        const { condition, scope } = config;
        const newScoped = condition[scope].concat(value);
        syncModel(value, config, newScoped);
    };

    const handleEditValue = (config) => ({ before, value }) => {
        const { condition, scope } = config;
        const newScoped = condition[scope].map((val) => {
            return before === val ? value : val;
        });
        syncModel(value, config, newScoped);
    };

    const hasError = (key, index) => ((errors[index] || {}).errors || []).includes(key);

    return (
        <>
            {model.Simple.Conditions.map((condition, index) => {
                const n = index + 1;
                return (
                    <Row key={`condition-${index}`}>
                        {condition.Type.value === 'attachments' ? (
                            <>
                                <Label>
                                    {c('Label').t`Conditions ${n}`}
                                    <SmallButton className="ml1" onClick={handleRemoveCondition(index)}>
                                        <Icon name="trash" />
                                    </SmallButton>
                                </Label>

                                <div className="w100">
                                    <Row>
                                        <Select
                                            onChange={handleChangeType({
                                                scope: 'Type',
                                                condition,
                                                index
                                            })}
                                            options={toOptions(TYPES)}
                                            defaultValue={condition.Type.value}
                                        />
                                    </Row>

                                    <RadioContainsAttachements
                                        comparator={condition.Comparator.value}
                                        onChange={handleChangeAttachments({ scope: 'Comparator', condition, index })}
                                    />
                                </div>
                            </>
                        ) : null}

                        {condition.Type.value !== 'attachments' ? (
                            <>
                                <Label>
                                    {c('Label').t`Conditions ${n}`}
                                    <SmallButton className="ml1" onClick={handleRemoveCondition(index)}>
                                        <Icon name="trash" />
                                    </SmallButton>
                                </Label>

                                <div className="w100">
                                    <Select
                                        options={toOptions(TYPES)}
                                        className="mb1"
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
                                </div>
                            </>
                        ) : null}
                    </Row>
                );
            })}

            <Row>
                <span className="pm-label" />
                <PrimaryButton type="button" className="ml50" onClick={handleAddNewCondition}>{c('Action')
                    .t`Add a new condition`}</PrimaryButton>
            </Row>
        </>
    );
}

ConditionsEditor.propTypes = {
    filter: PropTypes.object.isRequired,
    errors: PropTypes.array,
    onChange: PropTypes.func
};

ConditionsEditor.defaultProps = {
    errors: [],
    onChange: noop
};

export default ConditionsEditor;
