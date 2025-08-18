import { useMemo } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SearchableSelect, {
    type SearcheableSelectProps,
} from '@proton/components/components/selectTwo/SearchableSelect';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { type CountryWithStates, getStateList, isCountryWithStates } from '../../core/countries';

type StateSelectorProps = {
    onStateChange: (stateCode: string) => void;
    federalStateCode: string | null;
    selectedCountryCode: CountryWithStates;
} & Omit<SearcheableSelectProps<string>, 'children'>;

const StateSelectorInner = ({ onStateChange, federalStateCode, selectedCountryCode, ...rest }: StateSelectorProps) => {
    const states = useMemo(() => getStateList(selectedCountryCode), [selectedCountryCode]);

    const props: SearcheableSelectProps<string> = {
        onChange: ({ value: stateCode }: SelectChangeEvent<string>) => onStateChange?.(stateCode),
        value: federalStateCode ?? '',
        id: 'tax-state',
        placeholder: c('Placeholder').t`Select state`,
        children: states.map(({ stateName, stateCode }) => {
            return (
                <Option key={stateCode} value={stateCode} title={stateName} data-testid={`state-${stateCode}`}>
                    {stateName}
                </Option>
            );
        }),
        ...rest,
    };

    return <SearchableSelect {...props} data-testid="tax-state-dropdown" />;
};

export const StateSelector = ({
    selectedCountryCode,
    ...props
}: Omit<StateSelectorProps, 'selectedCountryCode'> & { selectedCountryCode: string }) => {
    if (!isCountryWithStates(selectedCountryCode)) {
        return null;
    }

    return <StateSelectorInner {...props} selectedCountryCode={selectedCountryCode} />;
};
