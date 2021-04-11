import React from 'react';
import { c } from 'ttag';

import { DENSITY } from 'proton-shared/lib/constants';

import comfortableDensitySvg from 'design-system/assets/img/pm-images/comfortable-density.svg';
import compactDensitySvg from 'design-system/assets/img/pm-images/compact-density.svg';

import { RadioCards } from '../../components';

const { COMFORTABLE, COMPACT } = DENSITY;

interface Props {
    density: DENSITY;
    onChange: (density: DENSITY) => void;
    loading: boolean;
    id: string;
}

const DensityRadios = ({ density, onChange, loading, id, ...rest }: Props) => {
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

export default DensityRadios;
