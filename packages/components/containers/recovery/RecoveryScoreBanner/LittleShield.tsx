import { type SVGProps, useId } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import './LittleShield.scss';

export interface LittleShieldProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
    toneClass: string;
    score: number;
}

export const LittleShield = ({ score, toneClass, className, ...props }: LittleShieldProps) => {
    const uid = useId().replace(/:/g, '');
    const paintId = `little-shield-paint0-radial-${uid}`;

    return (
        <svg
            width="21"
            height="27"
            viewBox="0 0 21 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            focusable="false"
            className={clsx(
                'recovery-score-little-shield pointer-events-none user-select-none',
                `recovery-score-little-shield--${toneClass}`,
                className
            )}
            {...props}
        >
            <title>{c('Recovery score').t`Recovery score: ${score}`}</title>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.17861 1.94204C10.0984 1.59484 11.1066 1.59484 12.0265 1.94204L20.054 4.97226C20.3834 5.09659 20.6025 5.42149 20.6025 5.78525V15.5179C20.6025 18.367 19.1034 20.9886 16.6939 22.3528L11.0016 25.576C10.7529 25.7168 10.4522 25.7168 10.2035 25.576L4.51116 22.3528C2.10169 20.9886 0.602539 18.367 0.602539 15.5179V5.78525C0.602539 5.42149 0.821756 5.09659 1.15109 4.97226L9.17861 1.94204Z"
                fill={`url(#${paintId})`}
            />
            <text
                x={10.5}
                y={13}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={14}
                fontWeight={600}
                fontStyle="normal"
                filter="url(#little-shield-score-shadow)"
            >
                {score}
            </text>
            <defs>
                <filter
                    id="little-shield-score-shadow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                    colorInterpolationFilters="sRGB"
                >
                    <feDropShadow dx="0" dy="0.5" stdDeviation="2" floodColor="black" floodOpacity="0.2" />
                </filter>
                <radialGradient
                    id={paintId}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(20.6025 14.6191) rotate(-180) scale(20 16.8974)"
                >
                    <stop stopColor="var(--recovery-score-little-shield-start)" />
                    <stop offset="1" stopColor="var(--recovery-score-little-shield-end)" />
                </radialGradient>
            </defs>
        </svg>
    );
};
