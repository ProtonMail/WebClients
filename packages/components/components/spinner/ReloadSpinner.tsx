import type { ComponentProps } from 'react';

import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import clsx from '@proton/utils/clsx';

import './ReloadSpinner.scss';

interface Props extends ComponentProps<typeof IcArrowRotateRight> {
    refreshing?: boolean;
    onRefresh?: () => void;
}

const ReloadSpinner = ({ className, refreshing = false, onRefresh, ...rest }: Props) => {
    const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (refreshing) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        onRefresh?.();
    };
    return (
        <IcArrowRotateRight
            onClick={handleClick}
            className={clsx([className, refreshing && 'location-refresh-rotate keep-motion'])}
            {...rest}
        />
    );
};

export default ReloadSpinner;
