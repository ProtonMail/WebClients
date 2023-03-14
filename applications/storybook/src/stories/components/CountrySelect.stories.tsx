import { useState } from 'react';

import { InputFieldTwo } from '@proton/components/components';
import CountrySelect from '@proton/components/components/country/CountrySelect';
import { CountryOption } from '@proton/components/components/country/helpers';

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
            <div className="flex flex-item-fluid flex-align-items-center flex-justify-center border p2">
                <CountrySelect
                    options={options}
                    preSelectedOption={options[0]}
                    preSelectedOptionDivider={!!preSelectedOptionDivider ? preSelectedOptionDivider : undefined}
                    hint={hint}
                />
            </div>
            <div className="flex flex-nowrap flex-gap-2 py2">
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
