import type { CSSProperties } from 'react';

export type ThemeSvgSize = 'small' | 'medium-wide' | 'medium' | 'large';
export type ThemeSvgColors = { prominent: string; standard: string; primary: string; weak: string };

interface Props {
    size?: ThemeSvgSize;
    colors: ThemeSvgColors;
    className?: string;
    style?: CSSProperties;
}

const ThemeSvg = ({ size = 'medium-wide', colors, className, style }: Props) => {
    const dimensions = {
        small: { width: 50, height: 32 },
        'medium-wide': { width: 106, height: 44 },
        medium: { width: 106, height: 66 },
        large: { width: 122, height: 57 },
    }[size];

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
            fill="none"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
            <path fill={colors.standard} d={`M0 0h${dimensions.width}v${dimensions.height}H0z`} />
            <path fill={colors.prominent} d={`M0 0h36v${dimensions.height}H0z`} />
            <rect width="20" height="4" x="8" y="8" fill={colors.primary} rx="2" ry="2" />
            <g fill={colors.weak}>
                <rect width="12" height="2" x="8" y="16" rx="1" ry="1" />
                <rect width="16" height="2" x="8" y="20" rx="1" ry="1" opacity="0.75" />
                <rect width="12" height="2" x="8" y="24" rx="1" ry="1" opacity="0.5" />
            </g>
        </svg>
    );
};

export default ThemeSvg;
