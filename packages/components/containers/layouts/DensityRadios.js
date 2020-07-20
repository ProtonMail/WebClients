import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { RadioCards } from 'react-components';
import { DENSITY } from 'proton-shared/lib/constants';
import comfortableDensitySvg from 'design-system/assets/img/pm-images/comfortable-density.svg';
import compactDensitySvg from 'design-system/assets/img/pm-images/compact-density.svg';

const { COMFORTABLE, COMPACT } = DENSITY;

const DensityRadios = ({ density, onChange, loading, id, ...rest }) => {
    const radioCardComfortable = {
        value: COMFORTABLE,
        checked: density === COMFORTABLE,
        id: 'comfortableRadio',
        disabled: loading,
        name: 'density',
        label: c('Label to change density').t`Comfortable`,
        onChange() {
            onChange(COMFORTABLE);
        },
        children: <img alt="Comfortable" src={comfortableDensitySvg} />,
    };
    const radioCardCompact = {
        value: COMPACT,
        checked: density === COMPACT,
        id: 'compactRadio',
        disabled: loading,
        name: 'density',
        label: c('Label to change density').t`Compact`,
        onChange() {
            onChange(COMPACT);
        },
        children: <img alt="Compact" src={compactDensitySvg} />,
    };

    return <RadioCards list={[radioCardComfortable, radioCardCompact]} id={id} {...rest} />;
};

DensityRadios.propTypes = {
    density: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    id: PropTypes.string,
};

export default DensityRadios;
