import { Attributes, ImgHTMLAttributes } from 'react';

import { getLocalizedCountryByAbbr } from '@proton/components/helpers/countries';
import clsx from '@proton/utils/clsx';

import { getFlagSvg } from '../flag';

export const getCountryFlagAndName = (
    languageOrLanguages: string | readonly string[],
    countryCode?: string,
    label?: string,
    rest: Attributes & ImgHTMLAttributes<HTMLImageElement> = {}
) => {
    const upperCode = (countryCode || '').toUpperCase();
    const flag = getFlagSvg(upperCode);
    const name = getLocalizedCountryByAbbr(upperCode, languageOrLanguages);
    const classes = rest.className;
    delete rest.className;

    return [
        flag && <img width={20} className={clsx(['mx-2 border', classes])} src={flag} alt={name} {...rest} />,
        label ?? name,
    ];
};
