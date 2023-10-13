import { c } from 'ttag';

import { Radio } from '../../components';
import { Condition, ConditionComparator } from '../filters/interfaces';

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
        <div className="flex w100 mb-6 on-mobile-flex-column">
            <Radio
                id={`condition-${index}-with-attachment`}
                name={`attachment-condition-${index}`}
                className="inline-flex flex-align-items-center mr-4 mb-2 md:mb-0"
                checked={withAttachment}
                onChange={toggleAttachment}
            >
                {c('email_forwarding_2023: Label').t`With attachment`}
            </Radio>
            <Radio
                id={`condition-${index}-without-attachment`}
                name={`attachment-condition-${index}`}
                className="inline-flex flex-align-items-center"
                checked={!withAttachment}
                onChange={toggleAttachment}
            >
                {c('email_forwarding_2023: Label').t`Without attachment`}
            </Radio>
        </div>
    );
};

export default AttachmentsCondition;
