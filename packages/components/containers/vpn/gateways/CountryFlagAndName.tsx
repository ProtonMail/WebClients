import type { ImgHTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

import { getFlagSvg } from '../flag';

export const CountryFlagAndName = ({
    countryCode,
    countryName,
    className,
    ...rest
}: {
    countryCode?: string;
    countryName?: string;
} & ImgHTMLAttributes<HTMLImageElement>) => {
    const upperCode = (countryCode || '').toUpperCase();
    const flag = getFlagSvg(upperCode);

    return (
        <>
            {flag && (
                <img
                    width={20}
                    className={clsx(['mx-2 border', className])}
                    src={flag}
                    alt={countryName}
                    loading="lazy"
                    {...rest}
                />
            )}
            {countryName}
        </>
    );
};
