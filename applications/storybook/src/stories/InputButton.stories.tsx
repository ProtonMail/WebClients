import React, { useState } from 'react';
import { InputButton } from 'react-components';

export default {
    component: InputButton,
    title: 'Components / InputButton',
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

export const Exclusivity = () => {
    const [checkedId, setCheckedId] = useState<null | string>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.checked) {
            setCheckedId(null);
        } else {
            setCheckedId(e.target.id);
        }
    };

    return (
        <div>
            {['1', '2', '3', '4', '5'].map((n) => (
                <InputButton
                    id={n}
                    title="checkbox"
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
