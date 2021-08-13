import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getCountryByAbbr, correctAbbr } from '../../../helpers/countries';

const flags = require.context('@proton/styles/assets/img/flags', true, /.svg$/);
const flagsMap = flags.keys().reduce((acc, key) => {
    acc[key] = () => flags(key);
    return acc;
}, {});

const getFlagSvg = (abbreviation) => {
    const key = `./${abbreviation}.svg`;
    if (!flagsMap[key]) {
        return;
    }
    return flagsMap[key]();
};

const Country = ({ server: { EntryCountry, ExitCountry } }) => {
    const isRouted = EntryCountry && EntryCountry !== ExitCountry;
    const correctEntryCountry = correctAbbr(EntryCountry);
    const correctExitCountry = correctAbbr(ExitCountry);
    const entryCountryName = getCountryByAbbr(correctEntryCountry);
    const exitCountryName = getCountryByAbbr(correctExitCountry);

    return (
        <div className="inline-flex-vcenter">
            <img width={20} className="mr0-5 bordered" src={getFlagSvg(correctExitCountry)} alt={exitCountryName} />
            {getCountryByAbbr(correctExitCountry)}
            {isRouted && <span className="ml0-25 color-weak">{c('CountryInfo').t`(via ${entryCountryName})`}</span>}
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
