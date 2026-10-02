import type { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './ProtonLoader.scss';

export enum ProtonLoaderType {
    Default = 'default',
    Negative = 'negative',
}

export interface ProtonLoaderProps extends ComponentPropsWithoutRef<'svg'> {
    type?: ProtonLoaderType;
}

const defaultColors = {
    fill: '#6D4AFF',
    stopColor: '#FFFFFF',
    stopColor2: '#6D4BFD',
};

const negativeColors = {
    fill: '#FFFFFF',
    stopColor: '#6D4AFF',
    stopColor2: '#FFFFFF',
};

export const ProtonLoader = ({ className, type = ProtonLoaderType.Default, ...rest }: ProtonLoaderProps) => {
    const colors = type === 'negative' ? negativeColors : defaultColors;
    const logoId = `p-logo-${type}`;
    const logoGradientId = `p-logo-gradient-${type}`;
    const gradientId = `p-gradient-${type}`;
    const lightGradientId = `p-light-gradient-${type}`;
    const lightMaskId = `p-light-mask-${type}`;
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            fill="none"
            viewBox="0 0 56 56"
            aria-hidden="true"
            className={clsx(['w-custom', className])}
            style={{ '--w-custom': '10em' }}
            {...rest}
        >
            <path
                id={logoId}
                fill={colors.fill}
                d="M5.88 41.353v14.56H16.1V41.985a5.11 5.11 0 015.11-5.11h10.479a18.436 18.436 0 0018.435-18.437A18.434 18.434 0 0031.69 0H5.88v18.2H16.1V9.618h14.897a8.723 8.723 0 110 17.445H20.166A14.281 14.281 0 005.88 41.353z"
            />
            <path
                id={logoGradientId}
                fill={`url(#${gradientId})`}
                d="M21.207 36.873A15.328 15.328 0 005.88 52.2v3.712H16.1V41.983a5.11 5.11 0 015.107-5.11z"
            />
            <mask id={lightMaskId} style={{ maskType: 'alpha' }}>
                <use href={`#${logoId}`} />
            </mask>
            <g mask={`url(#${lightMaskId})`}>
                <circle className="proton-loader-light" cx="40" cy="-52" r="50" fill={`url(#${lightGradientId})`} />
            </g>
            <defs>
                <radialGradient id={lightGradientId}>
                    <stop stopColor={colors.stopColor} stopOpacity=".5" />
                    <stop stopColor={colors.stopColor} stopOpacity="0" offset="1" />
                </radialGradient>
                <linearGradient id={gradientId} x1="13" x2="13" y1="53" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor={colors.stopColor2} />
                    <stop stopColor="#1C0554" offset="1" />
                </linearGradient>
            </defs>
        </svg>
    );
};
