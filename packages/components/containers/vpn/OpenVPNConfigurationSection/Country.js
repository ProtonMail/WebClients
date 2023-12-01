import PropTypes from 'prop-types';
import { c } from 'ttag';

import { useUserSettings } from '@proton/components/hooks';

import { correctAbbr, getLocalizedCountryByAbbr } from '../../../helpers/countries';
import { getFlagSvg } from '../flag';

const Country = ({ server: { EntryCountry, ExitCountry } }) => {
    const [userSettings] = useUserSettings();
    const isRouted = EntryCountry && EntryCountry !== ExitCountry;
    const correctEntryCountry = correctAbbr(EntryCountry);
    const correctExitCountry = correctAbbr(ExitCountry);
    const entryCountryName = getLocalizedCountryByAbbr(correctEntryCountry, userSettings.Locale || navigator.languages);
    const exitCountryName = getLocalizedCountryByAbbr(correctExitCountry, userSettings.Locale || navigator.languages);

    return (
        <div className="inline-flex children-self-center">
            <img width={20} className="mr-2 border" src={getFlagSvg(correctExitCountry)} alt={exitCountryName} />
            <p className="mx-1">{exitCountryName}</p>
            {isRouted && <span className="color-weak">{c('CountryInfo').t`(via ${entryCountryName})`}</span>}
        </div>
    );
};

Country.propTypes = {
    server: PropTypes.shape({
        EntryCountry: PropTypes.string,
        ExitCountry: PropTypes.string,
    }),
};

export default Country;
