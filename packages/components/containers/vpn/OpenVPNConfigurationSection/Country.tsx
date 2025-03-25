import { c } from 'ttag';

import { type CountryOptions, correctAbbr, getLocalizedCountryByAbbr } from '@proton/payments';
import type { Logical } from '@proton/shared/lib/vpn/Logical';

import { getFlagSvg } from '../flag';

const Country = ({
    server: { EntryCountry, ExitCountry },
    countryOptions,
}: {
    server: Logical;
    countryOptions: CountryOptions;
}) => {
    const isRouted = EntryCountry && EntryCountry !== ExitCountry;
    const correctEntryCountry = correctAbbr(EntryCountry);
    const correctExitCountry = correctAbbr(ExitCountry);
    const entryCountryName = getLocalizedCountryByAbbr(correctEntryCountry, countryOptions);
    const exitCountryName = getLocalizedCountryByAbbr(correctExitCountry, countryOptions);

    return (
        <div className="inline-flex *:self-center">
            <img
                width={20}
                className="mr-2 border"
                src={getFlagSvg(correctExitCountry)}
                alt={exitCountryName}
                loading="lazy"
            />
            <p className="mx-1">{exitCountryName}</p>
            {isRouted && <span className="color-weak">{c('CountryInfo').t`(via ${entryCountryName})`}</span>}
        </div>
    );
};
export default Country;
