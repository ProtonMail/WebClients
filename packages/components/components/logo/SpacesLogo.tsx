import { useState } from 'react';

import { SPACES_APP_NAME } from '@proton/shared/lib/constants';
import generateUID from '@proton/utils/generateUID';

import LogoBase, { type LogoProps } from './LogoBase';

// TODO: Add SVG for `wordmark-only` and `with-wordmark` variants
const SpacesLogo = ({ variant = 'with-wordmark', hasTitle = true, ...rest }: LogoProps) => {
    const [uid] = useState(generateUID('logo'));

    let logoWidth: number;
    const logoHeight = 36;

    switch (variant) {
        case 'glyph-only':
            logoWidth = 36;
            break;
        case 'wordmark-only':
            logoWidth = 451;
            break;
        default:
            logoWidth = 220;
            break;
    }

    return (
        <LogoBase
            uid={uid}
            logoWidth={logoWidth}
            logoHeight={logoHeight}
            title={hasTitle ? SPACES_APP_NAME : undefined}
            variant={variant}
            {...rest}
        >
            {variant === 'glyph-only' && (
                <>
                    <path
                        d="M16.0479 6.00002C22.064 6.00002 28.3379 10.2921 30.3481 16.4508C32.5454 23.1854 29.0404 29.7327 22.0597 30.8356C22.0568 30.8368 22.0541 30.8383 22.0512 30.8394C21.3787 30.9451 20.6738 31 19.9389 31C17.642 31 15.4001 30.4174 13.3755 29.391C10.5934 27.9806 8.31911 25.7929 6.84942 23.2558C5.62426 21.1408 4.96387 18.8039 5.00153 16.4523C5.02202 15.0916 5.27924 13.8219 5.73219 12.6696C5.73533 12.6657 5.73836 12.6617 5.7415 12.6578C5.73801 12.6612 5.73456 12.6647 5.73108 12.6681C7.32822 8.60502 11.3611 6.00002 16.0479 6.00002Z"
                        fill={`url(#paint0_radial_8872_453_${uid})`}
                    />
                    <path
                        opacity="0.6"
                        d="M16.0478 6.00002C22.0639 6.00002 28.3378 10.2925 30.348 16.4511C32.5106 23.0799 29.1491 29.5268 22.3862 30.7795C25.966 28.4291 27.4403 23.8992 25.9212 19.271C24.0906 13.6963 18.3775 9.81128 12.8991 9.81128C10.1378 9.81132 7.62578 10.7982 5.80249 12.4911C7.44605 8.52962 11.4295 6.00003 16.0478 6.00002Z"
                        fill={`url(#paint1_linear_8872_453_${uid})`}
                    />
                    <defs>
                        <radialGradient
                            id={`paint0_radial_8872_453_${uid}`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="matrix(-17.7326 29.6875 -35.2785 -22.4614 23.9381 0.27587)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset="0.403126" stopColor="#4F2CFD" />
                            <stop offset="0.9944" stopColor="#2F93F7" />
                        </radialGradient>
                        <linearGradient
                            id={`paint1_linear_8872_453_${uid}`}
                            x1="18.4012"
                            y1="6.00002"
                            x2="18.4012"
                            y2="30.7795"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="white" />
                            <stop offset="1" stopColor="white" stopOpacity="0.39" />
                        </linearGradient>
                    </defs>
                </>
            )}
        </LogoBase>
    );
};

export default SpacesLogo;
