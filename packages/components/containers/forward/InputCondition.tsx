import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';

import { useNotifications } from '../../hooks';
import type { Condition } from '../filters/interfaces';
import TokensCondition from './TokensCondition';

interface Props {
    index: number;
    condition: Condition;
    onUpdate: (condition: Condition) => void;
    validator?: (validations: string[]) => string;
}

const InputCondition = ({ index, validator, condition, onUpdate }: Props) => {
    const { createNotification } = useNotifications();
    const [inputValue, setInputValue] = useState('');
    const noTokens = !condition.values || condition.values.length === 0;
    const error =
        noTokens && validator
            ? validator([c('email_forwarding_2023: Error').t`Condition incomplete, please add a token`])
            : undefined;

    const onAddNewToken = () => {
        const values = condition.values || [];
        const clearedInputValue = inputValue.trim();

        if (!clearedInputValue.length) {
            return;
        }

        if (values.includes(clearedInputValue)) {
            createNotification({ text: c('email_forwarding_2023: Error').t`Token already exists`, type: 'error' });
        } else {
            values.push(clearedInputValue);
            onUpdate({ ...condition, values });
        }

        setInputValue('');
    };

    const onRemoveToken = (i: number) => {
        const values = condition.values || [];
        const newValues = values.filter((_, index) => index !== i);
        onUpdate({ ...condition, values: newValues });
    };

    return (
        <>
            <span id={`conditionvalue_${index}`} className="sr-only">{c('email_forwarding_2023: Placeholder')
                .t`Type text or keyword for this condition:`}</span>
            <InputFieldTwo
                onValue={setInputValue}
                value={inputValue}
                dense
                error={error}
                placeholder={c('email_forwarding_2023: Placeholder').t`Type text or keyword`}
                aria-describedby={`conditionvalue_${index} ifor_${index} conditiontype_${index} conditioncomparator_${index}`}
                id={`conditionvalue_${index}`}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        onAddNewToken();
                    }
                }}
                onBlur={() => {
                    if (inputValue) {
                        onAddNewToken();
                    }
                }}
            />
            <TokensCondition condition={condition} onRemove={onRemoveToken} />
        </>
    );
};

export default InputCondition;
