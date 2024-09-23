import { c } from 'ttag';

import Radio from '@proton/components/components/input/Radio';

import type { Condition } from '../filters/interfaces';
import { ConditionComparator } from '../filters/interfaces';

interface Props {
    index: number;
    condition: Condition;
    onUpdate: (condition: Condition) => void;
}

const AttachmentsCondition = ({ index, condition, onUpdate }: Props) => {
    const withAttachment = condition?.comparator === ConditionComparator.CONTAINS;
    const toggleAttachment = () => {
        onUpdate({
            ...condition,
            comparator: withAttachment ? ConditionComparator.DOES_NOT_CONTAIN : ConditionComparator.CONTAINS,
        });
    };

    return (
        <div className="flex w-full mb-6 flex-column md:flex-row">
            <Radio
                id={`condition-${index}-with-attachment`}
                name={`attachment-condition-${index}`}
                className="inline-flex items-center mr-4 mb-2 md:mb-0"
                checked={withAttachment}
                onChange={toggleAttachment}
            >
                {c('email_forwarding_2023: Label').t`With attachment`}
            </Radio>
            <Radio
                id={`condition-${index}-without-attachment`}
                name={`attachment-condition-${index}`}
                className="inline-flex items-center"
                checked={!withAttachment}
                onChange={toggleAttachment}
            >
                {c('email_forwarding_2023: Label').t`Without attachment`}
            </Radio>
        </div>
    );
};

export default AttachmentsCondition;
