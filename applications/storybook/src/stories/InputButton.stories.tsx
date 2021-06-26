import React, { useState } from 'react';
import { InputButton } from '@proton/components';
import { remove } from '@proton/shared/lib/helpers/array';

import mdx from './InputButton.mdx';

export default {
    component: InputButton,
    title: 'Components / InputButton',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [checked, setChecked] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(e.target.checked);
    };

    return (
        <InputButton id="checkbox" title="checkbox" checked={checked} onChange={handleChange}>
            A
        </InputButton>
    );
};

export const Multiple = () => {
    const [checkedIds, setCheckedIds] = useState<string[]>([]);

    const handleChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setCheckedIds([...checkedIds, id]);
        } else {
            setCheckedIds(remove(checkedIds, id));
        }
    };

    return (
        <div>
            {['1', '2', '3', '4', '5'].map((n) => (
                <InputButton
                    id={n}
                    title="checkbox"
                    checked={checkedIds.includes(n)}
                    onChange={handleChange(n)}
                    labelProps={{ className: 'mr1' }}
                >
                    {n}
                </InputButton>
            ))}
        </div>
    );
};

export const Exclusivity = () => {
    const [checkedId, setCheckedId] = useState<null | string>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCheckedId(e.target.value);
    };

    return (
        <div>
            {['1', '2', '3', '4', '5'].map((n) => (
                <InputButton
                    id={`radio-${n}`}
                    title="radio"
                    type="radio"
                    value={n}
                    checked={n === checkedId}
                    onChange={handleChange}
                    labelProps={{ className: 'mr1' }}
                >
                    {n}
                </InputButton>
            ))}
        </div>
    );
};
