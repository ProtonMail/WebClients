import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';

import { Tooltip } from '../../components';
import { COMPARATORS, TYPES, getComparatorLabels, getConditionTypeLabels } from '../filters/constants';
import type { Condition, ConditionComparator } from '../filters/interfaces';
import { ConditionType, FilterStatement } from '../filters/interfaces';
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
                <div className="flex-1 flex gap-4">
                    <div className="flex-1 flex flex-wrap flex-column md:flex-row gap-4">
                        <div className="md:flex-1">
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
                        <div className="md:flex-1">
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
                    <div className="shrink-0 w-custom" style={{ '--w-custom': '3em' }}>
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
