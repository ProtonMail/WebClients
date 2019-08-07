import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getCountryByAbbr } from 'react-components/helpers/countries';
const flags = require.context('design-system/assets/img/shared/flags/4x3', true, /.svg$/);

const getFlagSvg = (abbreviation) => flags(`./${abbreviation.toLowerCase()}.svg`);

const Country = ({ entry, exit }) => {
    // Backend returns UK instead of GB
    const abbrExit = exit === 'UK' ? 'GB' : exit;
    const abbrEntry = entry === 'UK' ? 'GB' : entry;
    const isRouted = abbrEntry && abbrEntry !== abbrExit;

    return (
        <div className="inline-flex-vcenter">
            <img width={20} className="mr0-5" src={getFlagSvg(abbrExit)} alt={`flag-${abbrExit}`} />
            {getCountryByAbbr(abbrExit)}
            {isRouted && (
                <span className="ml0-25 opacity-50">{c('CountryInfo').t`(via ${getCountryByAbbr(abbrEntry)})`}</span>
            )}
        </div>
    );
};

Country.propTypes = {
    entry: PropTypes.string,
    exit: PropTypes.string.isRequired
};

export default Country;
