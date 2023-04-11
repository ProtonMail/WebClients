import PropTypes from 'prop-types';
import { c } from 'ttag';

import { correctAbbr, getCountryByAbbr } from '../../../helpers/countries';
import { getFlagSvg } from '../flag';

const Country = ({ server: { EntryCountry, ExitCountry } }) => {
    const isRouted = EntryCountry && EntryCountry !== ExitCountry;
    const correctEntryCountry = correctAbbr(EntryCountry);
    const correctExitCountry = correctAbbr(ExitCountry);
    const entryCountryName = getCountryByAbbr(correctEntryCountry);
    const exitCountryName = getCountryByAbbr(correctExitCountry);

    return (
        <div className="inline-flex-vcenter">
            <img width={20} className="mr-2 border" src={getFlagSvg(correctExitCountry)} alt={exitCountryName} />
            <p className="mx-1">{getCountryByAbbr(correctExitCountry)}</p>
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
