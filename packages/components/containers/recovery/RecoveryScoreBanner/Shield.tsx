import type { SVGProps } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import './Shield.scss';

export interface ShieldProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
    score: number;
    maxScore: number;
    toneClass: string;
}

export const Shield = ({ score, maxScore, toneClass, className, ...props }: ShieldProps) => {
    const badgeNudgeX = score === maxScore ? 4 : 0;

    return (
        <svg
            width="60"
            height="56"
            viewBox="0 0 56 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            focusable="false"
            className={clsx('recovery-score-shield', `recovery-score-shield--${toneClass}`, className)}
            {...props}
        >
            <title>{c('Recovery score').t`Score: ${score} / ${maxScore}`}</title>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24.725 0.607599C26.8406 -0.202533 29.1594 -0.202533 31.275 0.607599L49.7384 7.67812C50.4959 7.96822 51 8.72631 51 9.57508V32.2847C51 38.9324 47.5519 45.0496 42.0101 48.2327L28.9178 55.7535C28.3457 56.0821 27.6543 56.0821 27.0822 55.7535L13.9898 48.2327C8.44804 45.0496 5 38.9324 5 32.2847V9.57508C5 8.72631 5.5042 7.96822 6.26166 7.67812L24.725 0.607599Z"
                fill="url(#paint0_radial_10148_123993)"
            />
            <g filter="url(#filter0_d_10148_123993)">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M25.1521 3.5425C26.9918 2.81917 29.0082 2.81917 30.8479 3.5425L46.903 9.85547C47.5617 10.1145 48 10.7914 48 11.5492V31.8256C48 37.7611 45.0017 43.2229 40.1827 46.0649L28.7981 52.7799C28.3006 53.0733 27.6994 53.0733 27.2019 52.7799L15.8172 46.0649C10.9983 43.2229 8 37.7611 8 31.8256V11.5492C8 10.7914 8.43843 10.1145 9.0971 9.85547L25.1521 3.5425Z"
                    fill="url(#paint1_radial_10148_123993)"
                />
                <path
                    d="M25.335 4.00781C27.057 3.33072 28.943 3.33072 30.665 4.00781L46.7197 10.3203C47.1698 10.4973 47.4999 10.9775 47.5 11.5488V31.8252C47.5 37.5968 44.5841 42.8881 39.9287 45.6338V45.6348L28.5439 52.3496C28.2033 52.5504 27.7967 52.5504 27.4561 52.3496L16.0713 45.6348V45.6338C11.4159 42.8881 8.5 37.5968 8.5 31.8252V11.5488C8.50013 10.9776 8.83013 10.4973 9.28027 10.3203L25.335 4.00781Z"
                    stroke="url(#paint2_linear_10148_123993)"
                    strokeOpacity="0.5"
                />
            </g>
            <g transform={`translate(${badgeNudgeX} 0)`}>
                <foreignObject x="30" y="17" width="29" height="23">
                    <div
                        style={{
                            backdropFilter: 'blur(1.5px)',
                            clipPath: 'url(#bgblur_0_10148_123993_clip_path)',
                            height: '100%',
                            width: '100%',
                        }}
                    />
                </foreignObject>
                <path
                    d="M41 20.25H48C52.2802 20.25 55.75 23.7198 55.75 28V29C55.75 33.2802 52.2802 36.75 48 36.75H41C36.7198 36.75 33.25 33.2802 33.25 29V28C33.25 23.7198 36.7198 20.25 41 20.25Z"
                    fill="url(#paint3_radial_10148_123993)"
                    fillOpacity="0.4"
                />
                <path
                    d="M41 20.25H48C52.2802 20.25 55.75 23.7198 55.75 28V29C55.75 33.2802 52.2802 36.75 48 36.75H41C36.7198 36.75 33.25 33.2802 33.25 29V28C33.25 23.7198 36.7198 20.25 41 20.25Z"
                    stroke="url(#paint4_linear_10148_123993)"
                    strokeWidth="0.5"
                />
                <g filter="url(#recovery-shield-score-shadow)">
                    <path
                        d="M39.8748 24.8864L37.5311 33.5938H36.2278L38.5716 24.8864H39.8748Z"
                        fill="var(--recovery-score-shield-badge-text)"
                    />
                </g>
                <g filter="url(#recovery-shield-score-shadow)">
                    <path
                        d="M44.5558 24.2727V33H42.9748V25.8111H42.9237L40.8825 27.1151V25.6662L43.0515 24.2727H44.5558ZM48.9975 33.1662C46.8924 33.1662 45.6353 31.5043 45.6353 28.6449C45.6396 25.794 46.9009 24.1534 48.9975 24.1534C51.0941 24.1534 52.3597 25.7983 52.3597 28.6449C52.3597 31.5085 51.1026 33.1705 48.9975 33.1662ZM48.9975 31.8324C50.0884 31.8324 50.766 30.7415 50.766 28.6449C50.7617 26.5653 50.0842 25.4702 48.9975 25.4702C47.9151 25.4702 47.2376 26.5653 47.2333 28.6449C47.229 30.7415 47.9109 31.8324 48.9975 31.8324Z"
                        fill="var(--recovery-score-shield-badge-text)"
                    />
                </g>
            </g>
            <text
                x={28}
                y={26.5}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--recovery-score-shield-score-text)"
                fontSize={24}
                fontWeight={500}
                fontStyle="normal"
                filter="url(#recovery-shield-score-shadow)"
            >
                {score}
            </text>
            <defs>
                <filter
                    id="filter0_d_10148_123993"
                    x="6"
                    y="2"
                    width="44"
                    height="54"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10148_123993" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_10148_123993" result="shape" />
                </filter>
                <clipPath id="bgblur_0_10148_123993_clip_path" transform="translate(-30 -17)">
                    <path d="M41 20.25H48C52.2802 20.25 55.75 23.7198 55.75 28V29C55.75 33.2802 52.2802 36.75 48 36.75H41C36.7198 36.75 33.25 33.2802 33.25 29V28C33.25 23.7198 36.7198 20.25 41 20.25Z" />
                </clipPath>
                <radialGradient
                    id="paint0_radial_10148_123993"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(51 31.3056) rotate(180) scale(46 30.5428)"
                >
                    <stop stopColor="var(--recovery-score-shield-paint0-start)" />
                    <stop offset="1" stopColor="var(--recovery-score-shield-paint0-end)" />
                </radialGradient>
                <radialGradient
                    id="paint1_radial_10148_123993"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(48 29.9531) rotate(-180) scale(40 35.203)"
                >
                    <stop stopColor="var(--recovery-score-shield-paint1-start)" />
                    <stop offset="1" stopColor="var(--recovery-score-shield-paint1-end)" />
                </radialGradient>
                <linearGradient
                    id="paint2_linear_10148_123993"
                    x1="28"
                    y1="3"
                    x2="28"
                    y2="53"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="var(--recovery-score-shield-gradient-highlight)" />
                    <stop offset="1" stopColor="var(--recovery-score-shield-gradient-highlight)" stopOpacity="0" />
                </linearGradient>
                <radialGradient
                    id="paint3_radial_10148_123993"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientTransform="matrix(23 -9.22732e-09 16.2186 38.0059 33 29.0667)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="var(--recovery-score-shield-paint3-start)" />
                    <stop offset="1" stopColor="var(--recovery-score-shield-paint3-end)" />
                </radialGradient>
                <linearGradient
                    id="paint4_linear_10148_123993"
                    x1="52"
                    y1="21"
                    x2="44"
                    y2="28"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="var(--recovery-score-shield-gradient-highlight)" />
                    <stop offset="1" stopColor="var(--recovery-score-shield-gradient-highlight)" stopOpacity="0" />
                </linearGradient>
                <filter
                    id="recovery-shield-score-shadow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                    colorInterpolationFilters="sRGB"
                >
                    <feDropShadow
                        dx="0"
                        dy="0.5"
                        stdDeviation="0.01"
                        floodColor="var(--recovery-score-shield-score-outline)"
                        floodOpacity="1"
                    />
                </filter>
            </defs>
        </svg>
    );
};
