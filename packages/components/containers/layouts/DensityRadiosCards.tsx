import React from 'react';
import { c } from 'ttag';

import { DENSITY } from 'proton-shared/lib/constants';

import comfortableDensitySvg from 'design-system/assets/img/pm-images/comfortable-density.svg';
import compactDensitySvg from 'design-system/assets/img/pm-images/compact-density.svg';

import { LayoutCards } from '../../components';

const { COMFORTABLE, COMPACT } = DENSITY;

interface Props {
    density: DENSITY;
    onChange: (density: DENSITY) => void;
    loading: boolean;
    describedByID: string;
    className?: string;
    liClassName?: string;
}

const DensityRadiosCards = ({ density, onChange, loading, className, liClassName, describedByID, ...rest }: Props) => {
    const layoutCardComfortable = {
        value: COMFORTABLE,
        selected: density === COMFORTABLE,
        disabled: loading,
        name: 'density',
        label: c('Label to change density').t`Comfortable`,
        onChange() {
            onChange(COMFORTABLE);
        },
        src: comfortableDensitySvg,
        describedByID,
    };
    const layoutCardCompact = {
        value: COMPACT,
        selected: density === COMPACT,
        disabled: loading,
        name: 'density',
        label: c('Label to change density').t`Compact`,
        onChange() {
            onChange(COMPACT);
        },
        src: compactDensitySvg,
        describedByID,
    };

    return (
        <LayoutCards
            list={[layoutCardComfortable, layoutCardCompact]}
            className={className}
            liClassName={liClassName}
            describedByID={describedByID}
            {...rest}
        />
    );
};

export default DensityRadiosCards;
