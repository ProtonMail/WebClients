import { useState } from 'react';

import generateUID from '@proton/atoms/generateUID';

export type ThemeSvgSize = 'small' | 'medium' | 'large';
export type ThemeSvgColors = { prominent: string; standard: string; primary: string; weak: string };

interface Props {
    size?: ThemeSvgSize;
    colors: ThemeSvgColors;
    className?: string;
}

const ThemeSvg = ({ size = 'medium', colors, className }: Props) => {
    // This illustration can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('themeThumb'));

    if (size === 'small') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 50 50">
                <path fill={colors.standard} d="M0 0h50v50H0z" />
                <path fill={colors.prominent} d="M0 0h30v50H0z" />
                <rect width="20" height="5" x="5" y="7" fill={colors.primary} rx="1" ry="1" />
                <g fill={colors.weak}>
                    <rect width="16.84" height="3" x="5" y="16" rx="1" ry="1" />
                    <rect width="12.63" height="3" x="5" y="23" rx="1" ry="1" />
                    <rect width="15.79" height="3" x="5" y="30" rx="1" ry="1" />
                </g>
                <path fill={`url(#${uid}-a)`} d="M0 0h50v50H0z" />
                <defs>
                    <linearGradient
                        id={`${uid}-a`}
                        x1="7.32"
                        x2="42.68"
                        y1="7.32"
                        y2="42.68"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor="#fff" stopOpacity=".1" />
                        <stop offset="1" stopColor={colors.primary} stopOpacity=".2" />
                    </linearGradient>
                </defs>
            </svg>
        );
    }

    if (size === 'medium') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 106 44">
                <path fill={colors.prominent} d="M0 0h106v44H0V0Z" />
                <rect width="24" height="5" x="5" y="8" fill={colors.primary} rx="1.5" />
                <path fill={colors.standard} d="M34 10a2 2 0 0 1 2-2h70v36H34V10Z" />
                <g fill={colors.weak}>
                    <rect width="18" height="2" x="5" y="29" rx="1" />
                    <rect width="16" height="2" x="5" y="23" rx="1" />
                    <rect width="20" height="2" x="5" y="17" rx="1" />
                </g>
                <path fill={`url(#${uid}-a)`} d="M0 0h106v44H0z" />
                <defs>
                    <linearGradient
                        id={`${uid}-a`}
                        x1="37.795"
                        x2="89.144"
                        y1="1.692"
                        y2="50.493"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#fff" stopOpacity=".1" />
                        <stop offset="1" stopColor={colors.weak} stopOpacity=".1" />
                    </linearGradient>
                </defs>
            </svg>
        );
    }

    // size === 'large'
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 122 78">
            <path fill={colors.prominent} d="M0 0h122v78H0V0Z" />
            <rect width="24" height="5" x="5" y="8" fill={colors.primary} rx="1.5" />
            <path fill={colors.standard} d="M34 10a2 2 0 0 1 2-2h86v70H34V10Z" />
            <g fill={colors.weak}>
                <rect width="18" height="2" x="5" y="29" rx="1" />
                <rect width="16" height="2" x="5" y="23" rx="1" />
                <rect width="20" height="2" x="5" y="17" rx="1" />
            </g>
            <path fill={`url(#${uid}-a)`} d="M0 0h122v78H0z" />
            <defs>
                <linearGradient
                    id={`${uid}-a`}
                    x1="43.5"
                    x2="124.964"
                    y1="3"
                    y2="53.265"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#fff" stopOpacity=".1" />
                    <stop offset="1" stopColor={colors.weak} stopOpacity=".1" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default ThemeSvg;
