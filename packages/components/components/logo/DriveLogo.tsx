import { ComponentPropsWithoutRef, useState } from 'react';

import { classnames, generateUID } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { LogoProps } from './Logo';

type Props = ComponentPropsWithoutRef<'svg'> & Pick<LogoProps, 'variant' | 'size' | 'hasTitle'>;

const DriveLogo = ({ variant = 'with-wordmark', size, className, hasTitle = true, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    const logoWidth = variant === 'with-wordmark' ? 140 : 36;

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
                        d="m4 9 4-2 7 4h12v17l-1 1H7a3 3 0 0 1-3-3V9Z"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        fillRule="evenodd"
                        d="M14.961 7.426A3 3 0 0 0 16.726 8H29a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3h-3V14.5a2.5 2.5 0 0 0-2.5-2.5H13a3 3 0 0 1-1.8-.6L8.8 9.6A3 3 0 0 0 7 9H4a3 3 0 0 1 3-3h5.024a3 3 0 0 1 1.765.574l1.172.852Z"
                        clipRule="evenodd"
                    />
                    <defs>
                        <radialGradient
                            id={`${uid}-a`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="matrix(42.9176 0 0 45.5519 28.926 -8.114)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".556" stopColor="#6D4AFF"/>
                            <stop offset="1" stopColor="#FF50C3"/>
                        </radialGradient>
                        <linearGradient
                            id={`${uid}-b`}
                            x1="3.631"
                            x2="38.345"
                            y1="-6.003"
                            y2="32.431"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#7341FF"/>
                            <stop offset=".359" stopColor="#B487FF"/>
                            <stop offset="1" stopColor="#FFC8FF"/>
                        </linearGradient>
                    </defs>
                </>
            )}

            {variant === 'with-wordmark' && (
                <>
                    <path
                        fill={`url(#${uid}-a)`}
                        d="m0 9 4-2 7 4h12v17l-1 1H3a3 3 0 0 1-3-3V9Z"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        fillRule="evenodd"
                        d="M10.961 7.426A3 3 0 0 0 12.726 8H25a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3h-3V14.5a2.5 2.5 0 0 0-2.5-2.5H9a3 3 0 0 1-1.8-.6L4.8 9.6A3 3 0 0 0 3 9H0a3 3 0 0 1 3-3h5.024a3 3 0 0 1 1.765.574l1.172.852Z"
                        clipRule="evenodd"
                    />
                    <path
                        fill="var(--logo-text-product-color)"
                        d="M107.045 12.12a6.552 6.552 0 0 1 2.508 2.476 7.186 7.186 0 0 1 0 6.959 6.55 6.55 0 0 1-2.508 2.49 7.27 7.27 0 0 1-3.658.904h-4.505V11.213h4.505a7.274 7.274 0 0 1 3.658.907Zm-3.507 10.38a4.163 4.163 0 0 0 2.177-.569 4.18 4.18 0 0 0 1.561-1.62 4.803 4.803 0 0 0 .553-2.234c0-.777-.188-1.544-.553-2.233a4.138 4.138 0 0 0-1.524-1.59 4.218 4.218 0 0 0-2.217-.586h-2.086v8.815l2.089.017Zm8.04-3.138a4.213 4.213 0 0 1 1.035-2.945c.695-.752 1.672-1.13 2.937-1.13.425-.002.849.046 1.265.14v2.294c-.199 0-.427-.02-.681-.02-.695 0-1.205.16-1.527.483a2.015 2.015 0 0 0-.481 1.47v5.292h-2.533l-.015-5.584Zm6.266-5.844a1.443 1.443 0 0 1-.473-1.095 1.495 1.495 0 0 1 .473-1.106 1.544 1.544 0 0 1 1.125-.463c.208-.004.413.036.604.116.191.08.365.198.51.346a1.495 1.495 0 0 1 .473 1.107 1.443 1.443 0 0 1-.473 1.095 1.55 1.55 0 0 1-1.111.452 1.566 1.566 0 0 1-1.128-.452Zm2.396 11.416h-2.533v-9.458h2.533v9.458Zm4.071 0-3.59-9.458h2.667l1.644 4.832c.254.847.402 1.353.442 1.53h.04c.119-.455.282-.966.461-1.53l1.644-4.832h2.687l-3.59 9.458h-2.405Zm15.298-3.862h-7.118c.112.571.419 1.089.867 1.46.447.35 1 .532 1.564.515.453.017.903-.063 1.322-.231.33-.16.598-.42.772-.746h2.345a3.885 3.885 0 0 1-1.644 2.281 4.927 4.927 0 0 1-2.747.795c-.892.02-1.775-.2-2.555-.632a4.416 4.416 0 0 1-1.727-1.761 5.268 5.268 0 0 1-.61-2.542c-.014-.886.2-1.764.621-2.542a4.491 4.491 0 0 1 1.724-1.761 4.885 4.885 0 0 1 2.493-.618 4.675 4.675 0 0 1 2.428.644 4.515 4.515 0 0 1 1.689 1.77 5.19 5.19 0 0 1 .613 2.513c.005.286-.009.572-.037.855Zm-6.277-3.16a2.522 2.522 0 0 0-.86 1.39h4.786a2.134 2.134 0 0 0-.772-1.37c-.442-.363-1-.557-1.573-.543a2.436 2.436 0 0 0-1.581.523Z"
                    />
                    <path
                        fill="var(--logo-text-proton-color)"
                        d="M38 21.26v3.664h2.56V21.42a1.282 1.282 0 0 1 1.279-1.286h2.624a4.592 4.592 0 0 0 3.261-1.361 4.652 4.652 0 0 0 1.351-3.28c0-1.228-.486-2.41-1.35-3.281a4.603 4.603 0 0 0-3.265-1.358H38v4.58h2.56v-2.159h3.73c.58 0 1.134.232 1.544.644a2.2 2.2 0 0 1 0 3.104c-.41.412-.964.644-1.544.644h-2.71a3.551 3.551 0 0 0-2.528 1.055 3.65 3.65 0 0 0-.776 1.166A3.54 3.54 0 0 0 38 21.259Zm11.47 3.664v-5.583c0-2.279 1.322-4.091 3.97-4.091a5.09 5.09 0 0 1 1.262.14v2.296c-.301-.02-.56-.02-.682-.02-1.402 0-2.005.646-2.005 1.955v5.303H49.47Zm5.994-4.734c0-2.802 2.104-4.937 5.033-4.937 2.929 0 5.033 2.135 5.033 4.937 0 2.802-2.104 4.957-5.033 4.957-2.929 0-5.033-2.158-5.033-4.957Zm7.558 0c0-1.592-1.064-2.722-2.525-2.722-1.465 0-2.525 1.127-2.525 2.722 0 1.612 1.063 2.722 2.525 2.722 1.464 0 2.525-1.113 2.525-2.722Zm10.646 0c0-2.802 2.104-4.937 5.032-4.937 2.926 0 5.03 2.135 5.03 4.937 0 2.802-2.104 4.957-5.03 4.957-2.928 0-5.032-2.158-5.032-4.957Zm7.554 0c0-1.592-1.063-2.722-2.524-2.722-1.462 0-2.525 1.127-2.525 2.722 0 1.612 1.063 2.722 2.525 2.722 1.461 0 2.525-1.113 2.525-2.722Zm3.831 4.734v-5.38c0-2.499 1.583-4.294 4.41-4.294 2.806 0 4.39 1.792 4.39 4.294v5.38h-2.525v-5.18c0-1.39-.623-2.259-1.865-2.259-1.243 0-1.865.867-1.865 2.259v5.18h-2.545Zm-12.147-7.436h-2.747v3.528c0 1.23.44 1.793 1.703 1.793.12 0 .42 0 .802-.02v2.075c-.52.14-.981.223-1.484.223-2.124 0-3.569-1.29-3.569-3.728v-3.87h-1.706v-2.036h.427a1.3 1.3 0 0 0 .489-.097 1.285 1.285 0 0 0 .694-.698 1.28 1.28 0 0 0 .096-.492v-1.918h2.545v3.205h2.747v2.035h.003Z"
                    />
                    <defs>
                        <radialGradient
                        id={`${uid}-a`}
                        cx="0"
                        cy="0"
                        r="1"
                        gradientTransform="matrix(42.9176 0 0 45.5519 24.926 -8.114)"
                        gradientUnits="userSpaceOnUse"
                    >
                            <stop offset=".556" stopColor="#6D4AFF"/>
                            <stop offset="1" stopColor="#FF50C3"/>
                        </radialGradient>
                        <linearGradient
                        id={`${uid}-b`}
                        x1="-.369"
                        x2="34.345"
                        y1="-6.003"
                        y2="32.431"
                        gradientUnits="userSpaceOnUse"
                    >
                            <stop stopColor="#7341FF"/>
                            <stop offset=".359" stopColor="#B487FF"/>
                            <stop offset="1" stopColor="#FFC8FF"/>
                        </linearGradient>
                    </defs>
                </>
            )}

            {hasTitle && <title id={`${uid}-title`}>{DRIVE_APP_NAME}</title>}
        </svg>
    );
};

export default DriveLogo;
