import { ChangeEvent, Fragment, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { Icon, Input, Option, Radio, SelectTwo, Tooltip } from '../../../components';
import { COMPARATORS, TYPES, getComparatorLabels, getConditionTypeLabels } from '../constants';
import { Condition, ConditionComparator, ConditionType, FilterStatement } from '../interfaces';

import './FilterConditionsFormRow.scss';

const { SELECT, SUBJECT, SENDER, RECIPIENT } = ConditionType;

interface Props {
    isNarrow: boolean;
    conditionIndex: number;
    statement: FilterStatement;
    condition: Condition;
    handleDelete: (index: number) => void;
    handleUpdateCondition: (index: number, condition: Condition) => void;
    displayDelete: boolean;
    isEdit: boolean;
}

const FilterConditionsFormRow = ({
    isNarrow,
    conditionIndex,
    statement,
    condition,
    handleDelete,
    handleUpdateCondition,
    displayDelete,
    isEdit,
}: Props) => {
    const typeOptions = TYPES.map(({ value }, i) => {
        return { text: getConditionTypeLabels(value), value, disabled: i === 0 };
    });
    const ConditionComparatorOptions = COMPARATORS.map(({ value }) => ({
        text: getComparatorLabels(value),
        value,
    }));
    const [isOpen, setIsOpen] = useState(condition.isOpen);
    const [tokens, setTokens] = useState<string[]>(condition.values || []);
    const [inputValue, setInputValue] = useState(!isEdit && condition.defaultValue ? condition.defaultValue : '');

    const { type, comparator } = condition;

    const statementLabel = statement === FilterStatement.ALL ? c('Label').t`AND` : c('Label').t`OR`;
    const label = conditionIndex === 0 ? c('Label').t`IF` : statementLabel;

    const onAddNewToken = () => {
        setTokens((tokens) => [...tokens, inputValue.trim()]);
        setInputValue('');
    };

    const onRemoveToken = (i: number) => {
        setTokens((tokens) => {
            const newTokens = tokens.filter((_, index) => index !== i);
            return newTokens;
        });
    };

    useEffect(() => {
        if (condition.type === SELECT) {
            condition.error = c('Error').t`Empty condition`;
        } else if (
            [SUBJECT, SENDER, RECIPIENT].includes(condition.type) &&
            (!condition.values || !condition.values.length)
        ) {
            condition.error = c('Error').t`Condition incomplete`;
        } else {
            condition.error = '';
        }
    }, [condition]);

    useEffect(() => {
        handleUpdateCondition(conditionIndex, {
            ...condition,
            values: tokens,
        });
    }, [tokens]);

    useEffect(() => {
        handleUpdateCondition(conditionIndex, {
            ...condition,
            isOpen,
        });
    }, [isOpen]);

    const onChangeInputValue = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const renderAttachmentsCondition = () => {
        const withAttachment = condition?.comparator === ConditionComparator.CONTAINS;
        const toggleAttachment = () => {
            handleUpdateCondition(conditionIndex, {
                ...condition,
                comparator: withAttachment ? ConditionComparator.DOES_NOT_CONTAIN : ConditionComparator.CONTAINS,
            });
        };

        return (
            <div className="mt-4 flex">
                <Radio
                    id={`condition-${conditionIndex}-with-attachment`}
                    name={`attachment-condition-${conditionIndex}`}
                    className="flex flex-nowrap radio--ontop mr-4"
                    checked={withAttachment}
                    onChange={toggleAttachment}
                >
                    {c('Label').t`With attachment`}
                </Radio>
                <Radio
                    id={`condition-${conditionIndex}-without-attachment`}
                    name={`attachment-condition-${conditionIndex}`}
                    className="flex flex-nowrap radio--ontop"
                    checked={!withAttachment}
                    onChange={toggleAttachment}
                >
                    {c('Label').t`Without attachment`}
                </Radio>
            </div>
        );
    };

    const renderToken = (token: string, i: number) => (
        <Fragment key={`Condition_${conditionIndex}_Token_${i}`}>
            {i > 0 && <span className="mx-2 text-sm">{c('Label').t`or`}</span>}
            <span
                key={`condition-${conditionIndex}-token-${i}`}
                className="inline-flex flex-row flex-align-items-center mb-2 condition-token"
            >
                <span className="text-ellipsis text-no-decoration" title={token}>
                    {token}
                </span>
                <button type="button" className="flex flex-item-noshrink ml-2" onClick={() => onRemoveToken(i)}>
                    <Icon name="cross" size={11} />
                    <span className="sr-only">{c('Action').t`Remove this label`}</span>
                </button>
            </span>
        </Fragment>
    );

    const renderGenericCondition = () => {
        return (
            <div className="mt-4 flex-item-fluid">
                <div className="flex flex-nowrap">
                    <span className="flex-item-fluid pr-4">
                        <Input
                            onChange={onChangeInputValue}
                            type="text"
                            value={inputValue}
                            placeholder={c('Placeholder').t`Type text or keyword`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onAddNewToken();
                                }
                            }}
                        />
                    </span>
                    <Button disabled={!inputValue.trim()} onClick={onAddNewToken} className="button-blue">{c('Action')
                        .t`Insert`}</Button>
                </div>
                {tokens.length ? <div className="mt-4">{tokens.map(renderToken)}</div> : null}
            </div>
        );
    };

    const renderClosed = () => {
        if (condition?.error) {
            return <em className="pt-2 color-danger">{condition?.error}</em>;
        }

        let label;
        let title;

        if (type === ConditionType.ATTACHMENTS) {
            const attachment =
                condition?.comparator === ConditionComparator.CONTAINS
                    ? c('Label').t`with attachments`
                    : c('Label').t`without attachment`;
            const attachmentStrong = <strong key="attachments">{attachment}</strong>;
            label = c('Label').jt`The email was sent ${attachmentStrong}`;
            title = c('Label').t`The email was sent ${attachment}`;
        } else {
            const typeLabel = getConditionTypeLabels(type);
            const comparatorLabel = getComparatorLabels(comparator);
            const values = condition?.values?.map((v, i) => {
                return i > 0 ? (
                    <Fragment key={`${v}${i}`}>
                        {` `}
                        {c('Label').t`or`}
                        {` `}
                        <strong>{v}</strong>
                    </Fragment>
                ) : (
                    <strong key={`${v}${i}`}>{v}</strong>
                );
            });
            const titleValues = condition?.values?.map((v, i) => {
                return i > 0 ? ` or ${v}` : v;
            });
            title = `${typeLabel} ${comparatorLabel} ${titleValues}`;
            label = (
                <>
                    {typeLabel}
                    {` `}
                    {comparatorLabel}
                    {` `}
                    {values}
                </>
            );
        }

        return (
            <span className="max-w100 pt-2 text-ellipsis" title={title}>
                {label}
            </span>
        );
    };

    const toggleSection = () => setIsOpen((isOpen) => !isOpen);

    return (
        <div className="border-bottom">
            <div
                className="flex flex-nowrap on-mobile-flex-column align-items-center py-4"
                data-testid={`filter-modal:condition-${conditionIndex}`}
            >
                <button type="button" className={clsx(['w20 text-left', isNarrow && 'mb-4'])} onClick={toggleSection}>
                    <Icon name="chevron-down" className={clsx([isOpen && 'rotateX-180'])} />
                    <span className={clsx(['ml-2', condition.error && 'color-danger'])}>{label}</span>
                </button>
                <div className={clsx(['flex flex-column flex-item-fluid', !isNarrow && 'ml-4'])}>
                    {isOpen ? (
                        <div className="flex">
                            <span className="w50 pr-4">
                                <SelectTwo
                                    value={type}
                                    onChange={({ value }) => {
                                        handleUpdateCondition(conditionIndex, {
                                            ...condition,
                                            type: value as ConditionType,
                                        });
                                    }}
                                >
                                    {typeOptions.map(({ text, value, disabled }) => (
                                        <Option key={value} value={value} disabled={disabled} title={text} />
                                    ))}
                                </SelectTwo>
                            </span>
                            {type &&
                                [ConditionType.SUBJECT, ConditionType.SENDER, ConditionType.RECIPIENT].includes(
                                    type
                                ) && (
                                    <span className="w50">
                                        <SelectTwo
                                            value={comparator}
                                            onChange={({ value }) => {
                                                handleUpdateCondition(conditionIndex, {
                                                    ...condition,
                                                    comparator: value as ConditionComparator,
                                                });
                                            }}
                                        >
                                            {ConditionComparatorOptions.map(({ text, value }) => (
                                                <Option key={value} value={value} title={text} />
                                            ))}
                                        </SelectTwo>
                                    </span>
                                )}
                        </div>
                    ) : (
                        renderClosed()
                    )}
                    {isOpen && type && type !== ConditionType.SELECT && (
                        <div className="flex">
                            {type === ConditionType.ATTACHMENTS
                                ? renderAttachmentsCondition()
                                : renderGenericCondition()}
                        </div>
                    )}
                </div>
                {displayDelete && (
                    <div>
                        <Tooltip title={c('Action').t`Delete`}>
                            <Button
                                onClick={() => handleDelete(conditionIndex)}
                                className={clsx([isNarrow ? 'mt-4' : 'ml-4'])}
                                icon
                            >
                                <Icon name="trash" alt={c('Action').t`Delete`} />
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterConditionsFormRow;
