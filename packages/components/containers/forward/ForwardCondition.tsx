import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';

import { Icon, Option, SelectTwo, Tooltip } from '../../components';
import { COMPARATORS, TYPES, getComparatorLabels, getConditionTypeLabels } from '../filters/constants';
import { Condition, ConditionComparator, ConditionType, FilterStatement } from '../filters/interfaces';
import AttachmentsCondition from './AttachmentsCondition';
import InputCondition from './InputCondition';

interface Props {
    condition: Condition;
    index: number;
    displayDelete: boolean;
    onDelete: () => void;
    onUpdate: (condition: Condition) => void;
    statement: FilterStatement;
    onChangeStatement: (statement: FilterStatement) => void;
    validator?: (validations: string[]) => string;
}

const ForwardCondition = ({
    index,
    displayDelete,
    condition,
    onDelete,
    onUpdate,
    onChangeStatement,
    validator,
    statement,
}: Props) => {
    const isFirst = index === 0;
    const typeOptions = TYPES.filter(
        ({ value }) => value !== ConditionType.RECIPIENT && value !== ConditionType.SELECT
    ).map(({ value }) => {
        return { text: getConditionTypeLabels(value), value };
    });
    const comparatorOptions = COMPARATORS.map(({ value }) => ({
        text: getComparatorLabels(value),
        value,
    }));
    return (
        <>
            <span id={`condition_${index}`} className="sr-only">{c('email_forwarding_2023: Placeholder')
                .t`Condition:`}</span>
            {isFirst ? (
                <label className="text-bold mb-0.5" id={`ifor_${index}`} aria-describedby={`condition_${index}`}>{c(
                    'Condition label'
                ).t`If`}</label>
            ) : (
                <div className="inline-block text-bold mb-0.5">
                    <SelectTwo
                        className="w-auto"
                        unstyled
                        value={statement}
                        onChange={({ value }) => onChangeStatement(value as FilterStatement)}
                        id={`ifor_${index}`}
                        aria-describedby={`condition_${index}`}
                        data-testid={`forward:condition:ifor-select_${index}`}
                    >
                        <Option value={FilterStatement.ALL} title={c('email_forwarding_2023: Label').t`And`} />
                        <Option value={FilterStatement.ANY} title={c('email_forwarding_2023: Label').t`Or`} />
                    </SelectTwo>
                </div>
            )}
            <div className="flex flex-nowrap gap-2">
                <div className="flex-item-fluid flex gap-4">
                    <div className="flex-item-fluid flex flex-wrap on-mobile-flex-column gap-4">
                        <div className="flex-item-fluid">
                            <SelectTwo
                                value={condition.type}
                                onChange={({ value }) => onUpdate({ ...condition, type: value as ConditionType })}
                                aria-describedby={`condition_${index} ifor_${index}`}
                                id={`conditiontype_${index}`}
                            >
                                {typeOptions.map(({ text, value }) => (
                                    <Option key={value} value={value} title={text} />
                                ))}
                            </SelectTwo>
                        </div>
                        <div className="flex-item-fluid">
                            {[ConditionType.SUBJECT, ConditionType.SENDER, ConditionType.RECIPIENT].includes(
                                condition.type
                            ) && (
                                <SelectTwo
                                    value={condition.comparator}
                                    onChange={({ value }) => {
                                        onUpdate({
                                            ...condition,
                                            comparator: value as ConditionComparator,
                                        });
                                    }}
                                    aria-describedby={`condition_${index} ifor_${index} conditiontype_${index}`}
                                    id={`conditioncomparator_${index}`}
                                >
                                    {comparatorOptions.map(({ text, value }) => (
                                        <Option key={value} value={value} title={text} />
                                    ))}
                                </SelectTwo>
                            )}
                        </div>
                    </div>

                    {condition.type === ConditionType.ATTACHMENTS ? (
                        <AttachmentsCondition index={index} condition={condition} onUpdate={onUpdate} />
                    ) : (
                        <InputCondition index={index} validator={validator} condition={condition} onUpdate={onUpdate} />
                    )}
                </div>

                {displayDelete && (
                    <div className="flex-item-noshrink w3e">
                        <Tooltip title={c('email_forwarding_2023: Action').t`Delete this condition`}>
                            <Button
                                data-testid={`forward:condition:delete-button_${index}`}
                                className="ml-auto flex"
                                shape="ghost"
                                onClick={() => onDelete()}
                                icon
                            >
                                <Icon name="trash" alt={c('email_forwarding_2023: Action').t`Delete this condition`} />
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>
        </>
    );
};

export default ForwardCondition;
