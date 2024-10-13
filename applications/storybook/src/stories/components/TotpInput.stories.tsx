import { useState } from 'react';

import { InlineLinkButton } from '@proton/atoms';
import { Toggle, TotpInput } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './TotpInput.mdx';

export default {
    component: TotpInput,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [value, setValue] = useState('');

    return <TotpInput value={value} length={6} onValue={setValue} type="number" />;
};

export const Length = () => {
    const [value, setValue] = useState('1a2b');
    const [centerDivider, setCenterDivider] = useState(true);

    return (
        <div>
            <div className="mb-4">
                <div className="flex justify-center">
                    <div className="w-2/3">
                        <TotpInput
                            value={value}
                            length={4}
                            onValue={setValue}
                            type="alphabet"
                            centerDivider={centerDivider}
                        />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Toggle
                    id="center-divider"
                    checked={centerDivider}
                    onChange={(e) => setCenterDivider(e.target.checked)}
                />
                <label htmlFor="center-divider" className="flex-1 text-sm">
                    Enable center divider
                </label>
            </div>
        </div>
    );
};

export const Type = () => {
    const [value, setValue] = useState('');
    const [type, setType] = useState<'number' | 'alphabet'>('alphabet');

    return (
        <>
            <TotpInput value={value} length={type === 'alphabet' ? 8 : 6} onValue={setValue} type={type} />
            <InlineLinkButton
                className="mt-4"
                onClick={() => {
                    setType(type === 'alphabet' ? 'number' : 'alphabet');
                }}
            >
                {type === 'alphabet' ? 'Use type `number`' : 'Use type `alphabet`'}
            </InlineLinkButton>
        </>
    );
};
