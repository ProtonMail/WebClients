import type { ChangeEvent } from 'react';
import { Fragment, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Input from '@proton/components/components/input/Input';
import Radio from '@proton/components/components/input/Radio';
import Option from '@proton/components/components/option/Option';
import { useNotifications } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { SelectTwo, Tooltip } from '../../../components';
import { COMPARATORS, TYPES, getComparatorLabels, getConditionTypeLabels } from '../constants';
import type { Condition } from '../interfaces';
import { ConditionComparator, ConditionType, FilterStatement } from '../interfaces';
import { getConditionLabel, getEmailSentLabel, getEmailSentLabelJt } from './helper';

import './FilterConditionsFormRow.scss';

const { SELECT, SUBJECT, SENDER, RECIPIENT } = ConditionType;

interface Props {
    conditionIndex: number;
    statement: FilterStatement;
    condition: Condition;
    handleDelete: (index: number) => void;
    handleUpdateCondition: (index: number, condition: Condition) => void;
    displayDelete: boolean;
    isEdit: boolean;
}

const FilterConditionsFormRow = ({
    conditionIndex,
    statement,
    condition,
    handleDelete,
    handleUpdateCondition,
    displayDelete,
    isEdit,
}: Props) => {
    const { createNotification } = useNotifications();
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
                className="inline-flex max-w-full flex-row items-center mb-2 condition-token"
            >
                <span className="text-ellipsis flex-1 text-no-decoration" title={token}>
                    {token}
                </span>
                <button type="button" className="flex shrink-0 ml-2" onClick={() => onRemoveToken(i)}>
                    <Icon name="cross" size={2.75} />
                    <span className="sr-only">{c('Action').t`Remove this label`}</span>
                </button>
            </span>
        </Fragment>
    );

    const renderGenericCondition = () => {
        return (
            <div className="mt-4 flex-1">
                <div className="flex flex-nowrap">
                    <span className="flex-1 pr-4">
                        <Input
                            onChange={onChangeInputValue}
                            type="text"
                            value={inputValue}
                            placeholder={c('Placeholder').t`Type text or keyword`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (inputValue.length === 0) {
                                        createNotification({
                                            text: c('Title').t`This field cannot be empty`,
                                            type: 'error',
                                        });
                                    } else if (inputValue.trim() === '') {
                                        createNotification({
                                            text: c('Title').t`This field cannot contain only spaces`,
                                            type: 'error',
                                        });
                                    } else {
                                        onAddNewToken();
                                    }
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
            const attachment = getConditionLabel(condition);
            const attachmentStrong = <strong key="attachments">{attachment}</strong>;
            label = getEmailSentLabelJt(attachmentStrong);
            title = getEmailSentLabel(attachment);
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
            <span className="max-w-full text-ellipsis" title={title}>
                {label}
            </span>
        );
    };

    const toggleSection = () => setIsOpen((isOpen) => !isOpen);

    return (
        <div className="border-bottom">
            <div
                className="flex flex-nowrap flex-column md:flex-row align-items-center gap-4 py-4"
                data-testid={`filter-modal:condition-${conditionIndex}`}
            >
                <button type="button" className={clsx(['w-1/4 text-left'])} onClick={toggleSection}>
                    <Icon name="chevron-down" className={clsx([isOpen && 'rotateX-180'])} />
                    <span className={clsx(['ml-2', condition.error && 'color-danger'])}>{label}</span>
                </button>
                <div className={clsx(['flex flex-column w-full'])}>
                    {isOpen ? (
                        <div className="flex max-w-full">
                            <span className="w-1/2 pr-4">
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
                                    <span className="w-1/2">
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
                        <div className="flex max-w-full">
                            {type === ConditionType.ATTACHMENTS
                                ? renderAttachmentsCondition()
                                : renderGenericCondition()}
                        </div>
                    )}
                </div>
                {displayDelete && (
                    <div className="shrink-0">
                        <Tooltip title={c('Action').t`Delete`}>
                            <Button onClick={() => handleDelete(conditionIndex)} icon>
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
