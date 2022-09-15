import { ComponentPropsWithoutRef, useState } from 'react';

import { classnames, generateUID } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { LogoProps } from './Logo';

type Props = ComponentPropsWithoutRef<'svg'> & Pick<LogoProps, 'variant' | 'size' | 'hasTitle'>;

const MailLogo = ({ variant = 'with-wordmark', className, size, hasTitle = true, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    const logoWidth = variant === 'with-wordmark' ? 134 : 36;

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
                        d="m21.78 14.36.002.002L14 23 4 11.993V7.245a.644.644 0 0 1 1.055-.495l11.095 9.213a2.896 2.896 0 0 0 3.7 0l1.93-1.602Z"
                        clipRule="evenodd"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        d="m26 10.857-4.22 3.504.002.001-5.588 4.936a2.575 2.575 0 0 1-3.35.05L4 11.993v14.11A2.896 2.896 0 0 0 6.897 29H26l2-9.072-2-9.072Z"
                    />
                    <path
                        fill={`url(#${uid}-c)`}
                        fillRule="evenodd"
                        d="M26 10.86V29h3.103c1.6 0 2.897-1.297 2.897-2.896V7.244a.644.644 0 0 0-1.055-.494L26 10.86Z"
                        clipRule="evenodd"
                    />
                    <defs>
                        <linearGradient
                            id={`${uid}-a`}
                            x1="14.507"
                            x2="5.116"
                            y1="23.152"
                            y2="-9.469"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#E3D9FF"/>
                            <stop offset="1" stopColor="#7341FF"/>
                        </linearGradient>
                        <linearGradient
                            id={`${uid}-c`}
                            x1="41.055"
                            x2="19.455"
                            y1="43.522"
                            y2="-3.075"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".271" stopColor="#E3D9FF"/>
                            <stop offset="1" stopColor="#7341FF"/>
                        </linearGradient>
                        <radialGradient
                            id={`${uid}-b`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="matrix(27.9882 0 0 26.381 27.895 13.077)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".556" stopColor="#6D4AFF"/>
                            <stop offset=".994" stopColor="#AA8EFF"/>
                        </radialGradient>
                    </defs>
                </>
            )}

            {variant === 'with-wordmark' && (
                <>
                    <path
                        fill={`url(#${uid}-a)`}
                        fillRule="evenodd"
                        d="m17.78 14.361.002.001L10 23 0 11.993V7.245a.644.644 0 0 1 1.055-.495l11.095 9.213a2.895 2.895 0 0 0 3.7 0l1.93-1.602Z"
                        clipRule="evenodd"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        d="m22 10.856-4.22 3.505.002.001-5.588 4.936a2.575 2.575 0 0 1-3.35.05L0 11.993v14.11A2.896 2.896 0 0 0 2.897 29H22l2-9.072-2-9.072Z"
                    />
                    <path
                        fill={`url(#${uid}-c)`}
                        fillRule="evenodd"
                        d="M22 10.86V29h3.103c1.6 0 2.897-1.297 2.897-2.896V7.245a.644.644 0 0 0-1.055-.495L22 10.86Z"
                        clipRule="evenodd"
                    />
                    <path
                        fill="var(--logo-text-proton-color)"
                        d="M38 21.26v3.664h2.56V21.42a1.282 1.282 0 0 1 1.279-1.286h2.624a4.592 4.592 0 0 0 3.261-1.361 4.652 4.652 0 0 0 1.351-3.28c0-1.228-.486-2.41-1.35-3.281a4.603 4.603 0 0 0-3.265-1.358H38v4.58h2.56v-2.159h3.73c.58 0 1.134.232 1.544.644a2.2 2.2 0 0 1 0 3.104c-.41.412-.964.644-1.544.644h-2.71a3.551 3.551 0 0 0-2.528 1.055 3.65 3.65 0 0 0-.776 1.166A3.54 3.54 0 0 0 38 21.259Zm11.47 3.664v-5.583c0-2.279 1.322-4.091 3.97-4.091a5.09 5.09 0 0 1 1.262.14v2.296c-.301-.02-.56-.02-.682-.02-1.402 0-2.005.646-2.005 1.955v5.303H49.47Zm5.994-4.734c0-2.802 2.104-4.937 5.033-4.937 2.929 0 5.033 2.135 5.033 4.937 0 2.802-2.104 4.957-5.033 4.957-2.929 0-5.033-2.158-5.033-4.957Zm7.558 0c0-1.592-1.064-2.722-2.525-2.722-1.465 0-2.525 1.127-2.525 2.722 0 1.612 1.063 2.722 2.525 2.722 1.464 0 2.525-1.113 2.525-2.722Zm10.646 0c0-2.802 2.104-4.937 5.032-4.937 2.926 0 5.03 2.135 5.03 4.937 0 2.802-2.104 4.957-5.03 4.957-2.928 0-5.032-2.158-5.032-4.957Zm7.554 0c0-1.592-1.063-2.722-2.524-2.722-1.462 0-2.525 1.127-2.525 2.722 0 1.612 1.063 2.722 2.525 2.722 1.461 0 2.525-1.113 2.525-2.722Zm3.831 4.734v-5.38c0-2.499 1.583-4.294 4.41-4.294 2.806 0 4.39 1.792 4.39 4.294v5.38h-2.525v-5.18c0-1.39-.623-2.259-1.865-2.259-1.243 0-1.865.867-1.865 2.259v5.18h-2.545Zm-12.147-7.436h-2.747v3.528c0 1.23.44 1.793 1.703 1.793.12 0 .42 0 .802-.02v2.075c-.52.14-.981.223-1.484.223-2.124 0-3.569-1.29-3.569-3.728v-3.87h-1.706v-2.036h.427a1.3 1.3 0 0 0 .489-.097 1.285 1.285 0 0 0 .694-.698 1.28 1.28 0 0 0 .096-.492v-1.918h2.545v3.205h2.747v2.035h.003Z"
                    />
                    <path
                        fill="var(--logo-text-product-color)"
                        d="M98.882 11.216h3.575l3.351 8.223c.299.69.554 1.393.769 2.11h.035c.215-.717.471-1.424.769-2.11l3.351-8.223h3.575V24.93h-2.59v-9.187a8.055 8.055 0 0 1 .043-.906h-.043c-.08.323-.186.64-.321.946l-3.713 8.987h-2.148l-3.724-8.987a7.46 7.46 0 0 1-.342-.946h-.04c.029.3.043.603.04.906v9.19h-2.587V11.216Zm24.283 4.666c.75.392 1.37.993 1.786 1.727a5.17 5.17 0 0 1 .652 2.614v4.706h-2.268l-.161-1.413a3.18 3.18 0 0 1-1.252 1.21 3.784 3.784 0 0 1-1.818.42 4.364 4.364 0 0 1-2.291-.62 4.476 4.476 0 0 1-1.648-1.75 5.345 5.345 0 0 1-.603-2.573 4.91 4.91 0 0 1 .655-2.514 4.702 4.702 0 0 1 1.808-1.77 5.141 5.141 0 0 1 2.553-.643 5.391 5.391 0 0 1 2.587.606Zm-.83 6.33c.494-.468.738-1.129.738-2.01a2.746 2.746 0 0 0-.706-1.958 2.455 2.455 0 0 0-.813-.56 2.446 2.446 0 0 0-.967-.198 2.465 2.465 0 0 0-1.781.758 3.05 3.05 0 0 0-.712 1.956c0 .715.253 1.407.712 1.956a2.367 2.367 0 0 0 1.786.755 2.438 2.438 0 0 0 1.743-.698Zm4.666-8.692a1.494 1.494 0 0 1-.356-.497 1.429 1.429 0 0 1-.12-.597 1.488 1.488 0 0 1 .476-1.106 1.617 1.617 0 0 1 2.269 0 1.5 1.5 0 0 1 .353.502c.08.192.123.395.12.604a1.458 1.458 0 0 1-.473 1.095 1.645 1.645 0 0 1-2.269 0Zm2.412 11.409h-2.55v-9.45h2.55v9.45Zm4.411 0h-2.553V11.216h2.553V24.93Z"
                    />
                    <defs>
                        <linearGradient
                            id={`${uid}-a`}
                            x1="10.507"
                            x2="1.116"
                            y1="23.152"
                            y2="-9.469"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#E3D9FF"/>
                            <stop offset="1" stopColor="#7341FF"/>
                        </linearGradient>
                        <linearGradient
                            id={`${uid}-c`}
                            x1="37.055"
                            x2="15.455"
                            y1="43.522"
                            y2="-3.075"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".271" stopColor="#E3D9FF"/>
                            <stop offset="1" stopColor="#7341FF"/>
                        </linearGradient>
                        <radialGradient
                            id={`${uid}-b`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="matrix(27.9882 0 0 26.381 23.895 13.077)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".556" stopColor="#6D4AFF"/>
                            <stop offset=".994" stopColor="#AA8EFF"/>
                        </radialGradient>
                    </defs>
                </>
            )}

            {hasTitle && <title id={`${uid}-title`}>{MAIL_APP_NAME}</title>}
        </svg>
    );
};

export default MailLogo;
