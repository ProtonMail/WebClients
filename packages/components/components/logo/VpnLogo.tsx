import { ComponentPropsWithoutRef, useState } from 'react';

import { classnames, generateUID } from '@proton/components';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import { LogoProps } from './Logo';

type Props = ComponentPropsWithoutRef<'svg'> & Pick<LogoProps, 'variant' | 'size' | 'hasTitle'>;

const VpnLogo = ({ variant = 'with-wordmark', size, className, hasTitle = true, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    const logoWidth = variant === 'with-wordmark' ? 138 : 36;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox={`0 0 ${logoWidth} 36`}
            width={logoWidth}
            height="36"
            fill="none"
            className={classnames(['logo', size && variant === 'glyph-only' && `icon-${size}p`, variant, className])}
            aria-labelledby={`${uid}-title`}
            {...rest}
        >
            {variant === 'glyph-only' && (
                <>
                    <path
                        fill={`url(#${uid}-a)`}
                        fillRule="evenodd"
                        d="M15.247 29.149c1.064 1.913 3.797 2.017 5.005.19l11.265-17.035c1.195-1.806.052-4.228-2.111-4.475L7.263 5.31c-2.36-.269-4.041 2.22-2.893 4.285l.09.16 9.88 6.77-.12 10.77 1.027 1.854Z"
                        clipRule="evenodd"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        d="m15.881 27.364 1-1.49 7.594-11.472c.664-1.003.03-2.349-1.17-2.487L4.456 9.752l9.764 17.552a.979.979 0 0 0 1.66.06Z"
                    />
                    <defs>
                        <linearGradient
                            id={`${uid}-a`}
                            x1="29.32"
                            x2="11.303"
                            y1="29.148"
                            y2="-1.922"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".066" stopColor="#8EFFEE"/>
                            <stop offset=".45" stopColor="#C9C7FF"/>
                            <stop offset="1" stopColor="#7341FF"/>
                        </linearGradient>
                        <linearGradient
                            id={`${uid}-b`}
                            x1="30.967"
                            x2="5.738"
                            y1="-22.452"
                            y2="31.512"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".48" stopColor="#6D4AFF"/>
                            <stop offset=".994" stopColor="#00F0C3"/>
                        </linearGradient>
                    </defs>
                </>
            )}

            {variant === 'with-wordmark' && (
                <>
                    <path
                        fill={`url(#${uid}-a)`}
                        fillRule="evenodd"
                        d="M11.247 29.149c1.064 1.913 3.797 2.017 5.005.19l11.265-17.035c1.195-1.806.052-4.228-2.111-4.475L3.263 5.31C.903 5.041-.778 7.53.37 9.595l.09.16 9.88 6.77-.12 10.77 1.027 1.854Z"
                        clipRule="evenodd"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        d="m11.881 27.364 1-1.49 7.594-11.472c.664-1.003.03-2.349-1.17-2.486L.456 9.752l9.764 17.552a.979.979 0 0 0 1.66.06Z"
                    />
                    <path
                        fill="var(--logo-text-product-color)"
                        d="M119.842 10.897h-6.572v14.25h2.604V21.6a1.303 1.303 0 0 1 1.301-1.303h2.667a4.682 4.682 0 0 0 4.684-4.689 4.688 4.688 0 0 0-2.887-4.352 4.65 4.65 0 0 0-1.797-.36Zm2.051 4.674a2.218 2.218 0 0 1-1.374 2.053 2.192 2.192 0 0 1-.85.168h-3.807v-4.44h3.807a2.222 2.222 0 0 1 2.219 2.233l.005-.014Zm-17.766 9.524-5.245-14.239h2.962l3.451 10.19c.136.366.235.742.292 1.127h.029c.044-.388.142-.767.293-1.126l3.462-10.19h2.982l-5.27 14.238h-2.956Zm21.373 0V10.853h2.283l6.716 8.832c.243.304.452.632.628.98h.041a11.14 11.14 0 0 1-.064-1.292v-8.52h2.69v14.239h-2.282l-6.737-8.832a6.517 6.517 0 0 1-.625-.98h-.023c.038.43.052.86.043 1.292v8.52h-2.67v.003Z"
                    />
                    <path
                        fill="var(--logo-text-proton-color)"
                        d="M38 21.26v3.664h2.56V21.42a1.282 1.282 0 0 1 1.279-1.286h2.624a4.592 4.592 0 0 0 3.261-1.361 4.652 4.652 0 0 0 1.351-3.28c0-1.228-.486-2.41-1.35-3.281a4.603 4.603 0 0 0-3.265-1.358H38v4.58h2.56v-2.159h3.73c.58 0 1.134.232 1.544.644a2.2 2.2 0 0 1 0 3.104c-.41.412-.964.644-1.544.644h-2.71a3.551 3.551 0 0 0-2.528 1.055 3.65 3.65 0 0 0-.776 1.166A3.54 3.54 0 0 0 38 21.259Zm11.47 3.664v-5.583c0-2.279 1.322-4.091 3.97-4.091a5.09 5.09 0 0 1 1.262.14v2.296c-.301-.02-.56-.02-.682-.02-1.402 0-2.005.646-2.005 1.955v5.303H49.47Zm5.994-4.734c0-2.802 2.104-4.937 5.033-4.937 2.929 0 5.033 2.135 5.033 4.937 0 2.802-2.104 4.957-5.033 4.957-2.929 0-5.033-2.158-5.033-4.957Zm7.558 0c0-1.592-1.064-2.722-2.525-2.722-1.465 0-2.525 1.127-2.525 2.722 0 1.612 1.063 2.722 2.525 2.722 1.464 0 2.525-1.113 2.525-2.722Zm10.646 0c0-2.802 2.104-4.937 5.032-4.937 2.926 0 5.03 2.135 5.03 4.937 0 2.802-2.104 4.957-5.03 4.957-2.928 0-5.032-2.158-5.032-4.957Zm7.554 0c0-1.592-1.063-2.722-2.524-2.722-1.462 0-2.525 1.127-2.525 2.722 0 1.612 1.063 2.722 2.525 2.722 1.461 0 2.525-1.113 2.525-2.722Zm3.831 4.734v-5.38c0-2.499 1.583-4.294 4.41-4.294 2.806 0 4.39 1.792 4.39 4.294v5.38h-2.525v-5.18c0-1.39-.623-2.259-1.865-2.259-1.243 0-1.865.867-1.865 2.259v5.18h-2.545Zm-12.147-7.436h-2.747v3.528c0 1.23.44 1.793 1.703 1.793.12 0 .42 0 .802-.02v2.075c-.52.14-.981.223-1.484.223-2.124 0-3.569-1.29-3.569-3.728v-3.87h-1.706v-2.036h.427a1.3 1.3 0 0 0 .489-.097 1.285 1.285 0 0 0 .694-.698 1.28 1.28 0 0 0 .096-.492v-1.918h2.545v3.205h2.747v2.035h.003Z"
                    />
                    <defs>
                        <linearGradient
                            id={`${uid}-a`}
                            x1="25.32"
                            x2="7.303"
                            y1="29.148"
                            y2="-1.922"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".066" stopColor="#8EFFEE"/>
                            <stop offset=".45" stopColor="#C9C7FF"/>
                            <stop offset="1" stopColor="#7341FF"/>
                        </linearGradient>
                        <linearGradient
                            id={`${uid}-b`}
                            x1="26.967"
                            x2="1.738"
                            y1="-22.452"
                            y2="31.512"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".48" stopColor="#6D4AFF"/>
                            <stop offset=".994" stopColor="#00F0C3"/>
                        </linearGradient>
                    </defs>
                </>
            )}

            {hasTitle && <title id={`${uid}-title`}>{VPN_APP_NAME}</title>}
        </svg>
    );
};

export default VpnLogo;
