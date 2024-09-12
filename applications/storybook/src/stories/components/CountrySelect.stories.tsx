import { useState } from 'react';

import { InputFieldTwo } from '@proton/components';
import CountrySelect from '@proton/components/components/country/CountrySelect';
import type { CountryOption } from '@proton/components/components/country/helpers';

import { getTitle } from '../../helpers/title';
import mdx from './CountrySelect.mdx';

export default {
    component: CountrySelect,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const options: CountryOption[] = [
    { countryName: 'France', countryCode: 'fr' },
    { countryName: 'Finland', countryCode: 'fi' },
    { countryName: 'Australia', countryCode: 'au' },
    { countryName: 'Belgium', countryCode: 'be' },
    { countryName: 'Switzerland', countryCode: 'ch' },
    { countryName: 'Sweden', countryCode: 'se' },
    { countryName: 'Ireland', countryCode: 'ie' },
    { countryName: 'Norway', countryCode: 'no' },
];

export const Basic = () => {
    return <CountrySelect options={options} />;
};

export const PreSelect = () => {
    const [preSelectedOptionDivider, setPreSelectedOptionDivider] = useState('');
    const [hint, setHint] = useState('');

    return (
        <>
            <div className="flex flex-1 items-center justify-center border p-7">
                <CountrySelect
                    options={options}
                    preSelectedOption={options[0]}
                    preSelectedOptionDivider={!!preSelectedOptionDivider ? preSelectedOptionDivider : undefined}
                    hint={hint}
                />
            </div>
            <div className="flex flex-nowrap gap-7 py-7">
                <InputFieldTwo
                    label="Divider"
                    placeholder="Change the pre-selected option divider text"
                    value={preSelectedOptionDivider}
                    onValue={(value: string) => setPreSelectedOptionDivider(value)}
                />
                <InputFieldTwo
                    label="Hint"
                    placeholder="Add a hint to the select"
                    value={hint}
                    onValue={(value: string) => setHint(value)}
                />
            </div>
        </>
    );
};
