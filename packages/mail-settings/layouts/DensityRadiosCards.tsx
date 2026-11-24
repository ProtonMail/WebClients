import { c } from 'ttag';

import LayoutCards from '@proton/components/components/input/LayoutCards';
import { DENSITY } from '@proton/shared/lib/constants';
import comfortableDensitySvg from '@proton/styles/assets/img/layout/layout-thumb-density-comfortable.svg';
import compactDensitySvg from '@proton/styles/assets/img/layout/layout-thumb-density-compact.svg';

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
