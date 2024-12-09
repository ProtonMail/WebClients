import type { ComponentPropsWithoutRef } from 'react';
import { useState } from 'react';

import { LUMO_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import type { LogoProps } from './Logo';

type Props = ComponentPropsWithoutRef<'svg'> & Pick<LogoProps, 'variant' | 'size' | 'hasTitle'>;

const LumoLogo = ({ variant = 'with-wordmark', size, className, hasTitle = true, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    if (variant === 'glyph-only') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 64 64"
                width="32"
                height="32"
                fill="none"
                role="img"
                className={clsx('logo', size && `icon-size-${size}`, variant, className)}
                aria-labelledby={`${uid}-title`}
                {...rest}
            >
                {hasTitle && <title id={`${uid}-title`}>{LUMO_APP_NAME}</title>}
                <defs>
                    <linearGradient
                        id="linear-gradient"
                        x1="28.77"
                        y1="28.4"
                        x2="45.55"
                        y2="28.4"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor="#1b1340" />
                        <stop offset="1" stopColor="#6d4aff" />
                    </linearGradient>
                </defs>
                <circle fill="#1b1340" cx="25.88" cy="34.66" r="19.67" />
                <path
                    fill="url(#linear-gradient)"
                    d="M41.18,39.81c1.33,0,2.61-.22,3.81-.61.35-1.46.55-2.98.55-4.55,0-7.78-4.53-14.49-11.09-17.68-3.42,2.21-5.69,6.05-5.69,10.42,0,6.85,5.57,12.41,12.42,12.41Z"
                />
                <path
                    fill="#6d4aff"
                    d="M41.18,44.26c-9.29,0-16.86-7.56-16.86-16.86s7.56-16.86,16.86-16.86,16.86,7.56,16.86,16.86-7.56,16.86-16.86,16.86ZM41.18,15.65c-6.48,0-11.75,5.27-11.75,11.75s5.27,11.75,11.75,11.75,11.75-5.27,11.75-11.75-5.27-11.75-11.75-11.75Z"
                />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 166.54 53.12"
            width="160"
            height="32"
            fill="none"
            role="img"
            className={clsx('logo', variant, className)}
            aria-labelledby={`${uid}-title`}
            {...rest}
        >
            {hasTitle && <title id={`${uid}-title`}>{LUMO_APP_NAME}</title>}
            <linearGradient
                id="linear-gradient"
                x1="26.46"
                y1="22.48"
                x2="41.66"
                y2="22.48"
                gradientUnits="userSpaceOnUse"
            >
                <stop offset="0" stopColor="#1b1340" />
                <stop offset="1" stopColor="#6d4aff" />
            </linearGradient>

            <g>
                <path
                    fill="var(--logo-text-proton-color)"
                    d="M63.24,30.14V11.34h5.5v18.8c0,2.69,2.18,4.88,4.88,4.88h3.19v5.5h-3.19c-5.73,0-10.38-4.65-10.38-10.38Z"
                />
                <path
                    fill="var(--logo-text-proton-color)"
                    d="M88.61,40.94c-5.86-.04-9.08-3.7-9.08-8.87v-10.7h5.62v10.3c0,2.69,1.18,4.35,3.46,4.4,2.48.04,3.54-1.63,3.54-4.35v-10.34h5.62v10.74c0,4.92-3.78,8.87-9.16,8.83Z"
                />
                <path
                    fill="var(--logo-text-proton-color)"
                    d="M101.99,29.79c0-5.49,2.89-8.87,8.55-8.87,3.78,0,5.74,2.2,6.51,3.5h.08c.77-1.3,2.73-3.5,6.51-3.5,5.66,0,8.55,3.38,8.55,8.87v10.7h-5.62v-10.3c0-2.69-1.06-4.4-3.34-4.4s-3.34,1.71-3.34,4.4v10.3h-5.62v-10.3c0-2.69-1.06-4.4-3.34-4.4s-3.34,1.71-3.34,4.4v10.3h-5.62v-10.7Z"
                />
                <path
                    fill="var(--logo-text-proton-color)"
                    d="M145.68,40.94c-6.06,0-10.34-4.31-10.34-10.01s4.27-10.01,10.34-10.01,10.34,4.31,10.34,10.01-4.27,10.01-10.34,10.01ZM145.68,36.1c2.81,0,4.8-2.12,4.8-5.17s-1.99-5.17-4.8-5.17-4.8,2.12-4.8,5.17,1.99,5.17,4.8,5.17Z"
                />
            </g>
            <g>
                <circle fill="#1b1340" cx="23.85" cy="28.15" r="17.81" />
                <path
                    fill="url(#linear-gradient)"
                    d="M37.71,32.82c1.21,0,2.36-.2,3.45-.55.31-1.32.5-2.7.5-4.12,0-7.05-4.11-13.12-10.05-16.01-3.09,2.01-5.15,5.48-5.15,9.43,0,6.2,5.04,11.24,11.24,11.24Z"
                />
                <path
                    fill="#6d4aff"
                    d="M37.71,36.84c-8.42,0-15.26-6.85-15.26-15.26s6.85-15.26,15.26-15.26,15.26,6.85,15.26,15.26-6.85,15.26-15.26,15.26ZM37.71,10.94c-5.87,0-10.64,4.77-10.64,10.64s4.77,10.64,10.64,10.64,10.64-4.77,10.64-10.64-4.77-10.64-10.64-10.64Z"
                />
            </g>
        </svg>
    );
};

export default LumoLogo;
