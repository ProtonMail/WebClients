import { ComponentPropsWithoutRef, useState } from 'react';

import { generateUID } from '@proton/components';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { LogoProps } from './Logo';

type Props = ComponentPropsWithoutRef<'svg'> & Pick<LogoProps, 'variant' | 'size' | 'hasTitle'>;

const PassLogo = ({ variant = 'with-wordmark', size, className, hasTitle = true, ...rest }: Props) => {
    // This logo can be several times in the view, ids has to be different each time
    const [uid] = useState(generateUID('logo'));

    const logoWidth = variant === 'with-wordmark' ? 142 : 36;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox={`0 0 ${logoWidth} 36`}
            width={logoWidth}
            height="36"
            fill="none"
            role="img"
            className={clsx('logo', size && variant === 'glyph-only' && `icon-${size}p`, variant, className)}
            aria-labelledby={`${uid}-title`}
            {...rest}
        >
            {hasTitle && <title id={`${uid}-title`}>{PASS_APP_NAME}</title>}
            {variant === 'glyph-only' && (
                <>
                    <path
                        fill={`url(#${uid}-a)`}
                        d="M12.42 7.54c1.95-1.96 2.93-2.93 4.06-3.3a4.93 4.93 0 0 1 3.04 0c1.13.37 2.1 1.34 4.06 3.3l4.88 4.88c1.96 1.95 2.93 2.93 3.3 4.06.32.99.32 2.05 0 3.04-.37 1.13-1.34 2.1-3.3 4.06l-4.88 4.88c-1.95 1.96-2.93 2.93-4.06 3.3-.99.32-2.05.32-3.04 0-1.13-.37-2.1-1.34-4.06-3.3l-.92-1.03a7.87 7.87 0 0 1-1.03-1.28 3.7 3.7 0 0 1-.38-1c-.09-.4-.09-.82-.09-1.66V12.51c0-.84 0-1.26.09-1.65.08-.35.2-.7.38-1 .2-.36.48-.67 1.03-1.3l.92-1.02Z"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        d="M12.42 7.54c1.95-1.96 2.93-2.93 4.06-3.3a4.93 4.93 0 0 1 3.04 0c1.13.37 2.1 1.34 4.06 3.3l4.88 4.88c1.96 1.95 2.93 2.93 3.3 4.06.32.99.32 2.05 0 3.04-.37 1.13-1.34 2.1-3.3 4.06l-4.88 4.88c-1.95 1.96-2.93 2.93-4.06 3.3-.99.32-2.05.32-3.04 0-1.13-.37-2.1-1.34-4.06-3.3l-.92-1.03a7.87 7.87 0 0 1-1.03-1.28 3.7 3.7 0 0 1-.38-1c-.09-.4-.09-.82-.09-1.66V12.51c0-.84 0-1.26.09-1.65.08-.35.2-.7.38-1 .2-.36.48-.67 1.03-1.3l.92-1.02Z"
                    />
                    <path
                        fill={`url(#${uid}-c)`}
                        d="M12.07 7.89c.98-.98 1.47-1.47 2.03-1.65.5-.16 1.03-.16 1.52 0 .57.18 1.05.67 2.03 1.65l7.33 7.32c.97.98 1.46 1.46 1.64 2.03.16.5.16 1.03 0 1.52-.18.56-.67 1.05-1.64 2.03l-7.33 7.32c-.98.98-1.46 1.47-2.03 1.65-.5.16-1.03.16-1.52 0-.56-.18-1.05-.67-2.03-1.65l-4.53-4.53c-1.96-1.95-2.93-2.93-3.3-4.06a4.93 4.93 0 0 1 0-3.04c.37-1.13 1.34-2.1 3.3-4.06l4.53-4.53Z"
                    />
                    <defs>
                        <radialGradient
                            id={`${uid}-a`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="rotate(-58.14 35.5 5.08) scale(23.3731 36.5508)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#FFD580" />
                            <stop offset=".09" stopColor="#F6C592" />
                            <stop offset=".2" stopColor="#EBB6A2" />
                            <stop offset=".32" stopColor="#DFA5AF" />
                            <stop offset=".43" stopColor="#D397BE" />
                            <stop offset=".53" stopColor="#C486CB" />
                            <stop offset=".65" stopColor="#B578D9" />
                            <stop offset=".77" stopColor="#A166E5" />
                            <stop offset=".89" stopColor="#8B57F2" />
                            <stop offset="1" stopColor="#704CFF" />
                        </radialGradient>
                        <linearGradient
                            id={`${uid}-b`}
                            x1="11.49"
                            x2="16.93"
                            y1="-1.56"
                            y2="31.68"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#6D4AFF" />
                            <stop offset=".39" stopColor="#B39FFB" stopOpacity=".98" />
                            <stop offset="1" stopColor="#FFE8DB" stopOpacity=".8" />
                        </linearGradient>
                        <radialGradient
                            id={`${uid}-c`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="matrix(9.923 -15.96803 24.97081 15.51758 10.4 29.7)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#FFD580" />
                            <stop offset=".09" stopColor="#F6C592" />
                            <stop offset=".2" stopColor="#EBB6A2" />
                            <stop offset=".32" stopColor="#DFA5AF" />
                            <stop offset=".43" stopColor="#D397BE" />
                            <stop offset=".53" stopColor="#C486CB" />
                            <stop offset=".65" stopColor="#B578D9" />
                            <stop offset=".77" stopColor="#A166E5" />
                            <stop offset=".89" stopColor="#8B57F2" />
                            <stop offset="1" stopColor="#704CFF" />
                        </radialGradient>
                    </defs>
                </>
            )}

            {variant === 'with-wordmark' && (
                <>
                    <path
                        fill={`url(#${uid}-a)`}
                        d="M12.42 7.54c1.95-1.96 2.93-2.93 4.06-3.3a4.93 4.93 0 0 1 3.04 0c1.13.37 2.1 1.34 4.06 3.3l4.88 4.88c1.96 1.95 2.93 2.93 3.3 4.06.32.99.32 2.05 0 3.04-.37 1.13-1.34 2.1-3.3 4.06l-4.88 4.88c-1.95 1.96-2.93 2.93-4.06 3.3-.99.32-2.05.32-3.04 0-1.13-.37-2.1-1.34-4.06-3.3l-.92-1.03a7.87 7.87 0 0 1-1.03-1.28 3.7 3.7 0 0 1-.38-1c-.09-.4-.09-.82-.09-1.66V12.51c0-.84 0-1.26.09-1.65.08-.35.2-.7.38-1 .2-.36.48-.67 1.03-1.3l.92-1.02Z"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        d="M12.42 7.54c1.95-1.96 2.93-2.93 4.06-3.3a4.93 4.93 0 0 1 3.04 0c1.13.37 2.1 1.34 4.06 3.3l4.88 4.88c1.96 1.95 2.93 2.93 3.3 4.06.32.99.32 2.05 0 3.04-.37 1.13-1.34 2.1-3.3 4.06l-4.88 4.88c-1.95 1.96-2.93 2.93-4.06 3.3-.99.32-2.05.32-3.04 0-1.13-.37-2.1-1.34-4.06-3.3l-.92-1.03a7.87 7.87 0 0 1-1.03-1.28 3.7 3.7 0 0 1-.38-1c-.09-.4-.09-.82-.09-1.66V12.51c0-.84 0-1.26.09-1.65.08-.35.2-.7.38-1 .2-.36.48-.67 1.03-1.3l.92-1.02Z"
                    />
                    <path
                        fill={`url(#${uid}-c)`}
                        d="M12.07 7.89c.98-.98 1.47-1.47 2.03-1.65.5-.16 1.03-.16 1.52 0 .57.18 1.05.67 2.03 1.65l7.33 7.32c.97.98 1.46 1.46 1.64 2.03.16.5.16 1.03 0 1.52-.18.56-.67 1.05-1.64 2.03l-7.33 7.32c-.98.98-1.46 1.47-2.03 1.65-.5.16-1.03.16-1.52 0-.56-.18-1.05-.67-2.03-1.65l-4.53-4.53c-1.96-1.95-2.93-2.93-3.3-4.06a4.93 4.93 0 0 1 0-3.04c.37-1.13 1.34-2.1 3.3-4.06l4.53-4.53Z"
                    />
                    <path
                        fill="var(--logo-text-product-color)"
                        d="M119.02 15.65a4.82 4.82 0 0 0-4.98 4.9c0 2.96 2.04 4.92 4.5 4.92 1.36 0 2.44-.6 3.04-1.62l.16 1.4h2.24v-4.68c0-3.04-2.12-4.92-4.96-4.92Zm0 7.6c-1.42 0-2.48-1.1-2.48-2.7s1.08-2.7 2.48-2.7c1.38 0 2.46 1.06 2.46 2.7 0 1.84-1.24 2.7-2.46 2.7Zm9.87 2.22c1.92 0 3.56-1.1 3.56-2.78 0-3.6-4.86-2.76-4.86-4.22 0-.48.42-.84 1.08-.84.68 0 1.12.38 1.22.94h2.38c-.14-1.84-1.54-2.94-3.6-2.92-2.12 0-3.42 1.26-3.42 2.82 0 3.64 4.8 2.7 4.8 4.22 0 .46-.44.8-1.16.8-.7 0-1.34-.34-1.46-1.06H125c.14 1.78 1.7 3.04 3.88 3.04Zm8.41 0c1.92 0 3.56-1.1 3.56-2.78 0-3.6-4.86-2.76-4.86-4.22 0-.48.42-.84 1.08-.84.68 0 1.12.38 1.22.94h2.38c-.14-1.84-1.54-2.94-3.6-2.92-2.12 0-3.42 1.26-3.42 2.82 0 3.64 4.8 2.7 4.8 4.22 0 .46-.44.8-1.16.8-.7 0-1.34-.34-1.46-1.06h-2.42c.14 1.78 1.7 3.04 3.88 3.04ZM109.47 11h-6.57v14.25h2.6V21.7a1.3 1.3 0 0 1 1.3-1.3h2.67a4.68 4.68 0 0 0 4.34-6.49 4.67 4.67 0 0 0-4.34-2.91Zm2.05 4.67a2.2 2.2 0 0 1-.65 1.58 2.2 2.2 0 0 1-1.57.64h-3.8v-4.43h3.8a2.22 2.22 0 0 1 2.22 2.23v-.02Z"
                    />
                    <path
                        fill="var(--logo-text-proton-color)"
                        d="M42 21.26v3.66h2.56v-3.5a1.28 1.28 0 0 1 1.28-1.29h2.62a4.6 4.6 0 0 0 4.62-4.64 4.66 4.66 0 0 0-4.62-4.64H42v4.58h2.56v-2.16h3.73a2.18 2.18 0 0 1 2.18 2.2 2.2 2.2 0 0 1-2.18 2.2h-2.71a3.51 3.51 0 0 0-2.53 1.05A3.65 3.65 0 0 0 42 21.26Zm11.47 3.66v-5.58c0-2.28 1.32-4.09 3.97-4.09.42 0 .85.04 1.26.14v2.3c-.3-.02-.56-.02-.68-.02-1.4 0-2 .64-2 1.95v5.3h-2.55Zm5.99-4.73c0-2.8 2.1-4.94 5.04-4.94a4.85 4.85 0 0 1 5.03 4.94c0 2.8-2.1 4.96-5.03 4.96a4.87 4.87 0 0 1-5.04-4.96Zm7.56 0c0-1.6-1.06-2.72-2.52-2.72-1.47 0-2.53 1.12-2.53 2.72 0 1.61 1.07 2.72 2.53 2.72 1.46 0 2.52-1.11 2.52-2.72Zm10.65 0c0-2.8 2.1-4.94 5.03-4.94a4.85 4.85 0 0 1 5.03 4.94c0 2.8-2.1 4.96-5.03 4.96a4.87 4.87 0 0 1-5.03-4.96Zm7.55 0c0-1.6-1.06-2.72-2.52-2.72s-2.53 1.12-2.53 2.72c0 1.61 1.07 2.72 2.53 2.72 1.46 0 2.52-1.11 2.52-2.72Zm3.83 4.73v-5.38c0-2.5 1.59-4.29 4.41-4.29 2.8 0 4.4 1.8 4.4 4.3v5.37h-2.53v-5.18c0-1.39-.62-2.25-1.87-2.25-1.24 0-1.86.86-1.86 2.25v5.18h-2.55ZM76.9 17.49h-2.74v3.53c0 1.23.44 1.79 1.7 1.79.12 0 .42 0 .8-.02v2.07c-.52.14-.98.23-1.48.23-2.12 0-3.57-1.3-3.57-3.73v-3.87h-1.7v-2.04h.42a1.3 1.3 0 0 0 .9-.37 1.3 1.3 0 0 0 .38-.91v-1.92h2.55v3.2h2.74v2.04Z"
                    />
                    <defs>
                        <radialGradient
                            id={`${uid}-a`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="rotate(-58.14 35.5 5.08) scale(23.3731 36.5508)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#FFD580" />
                            <stop offset=".09" stopColor="#F6C592" />
                            <stop offset=".2" stopColor="#EBB6A2" />
                            <stop offset=".32" stopColor="#DFA5AF" />
                            <stop offset=".43" stopColor="#D397BE" />
                            <stop offset=".53" stopColor="#C486CB" />
                            <stop offset=".65" stopColor="#B578D9" />
                            <stop offset=".77" stopColor="#A166E5" />
                            <stop offset=".89" stopColor="#8B57F2" />
                            <stop offset="1" stopColor="#704CFF" />
                        </radialGradient>
                        <linearGradient
                            id={`${uid}-b`}
                            x1="11.49"
                            x2="16.93"
                            y1="-1.56"
                            y2="31.68"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#6D4AFF" />
                            <stop offset=".39" stopColor="#B39FFB" stopOpacity=".98" />
                            <stop offset="1" stopColor="#FFE8DB" stopOpacity=".8" />
                        </linearGradient>
                        <radialGradient
                            id={`${uid}-c`}
                            cx="0"
                            cy="0"
                            r="1"
                            gradientTransform="matrix(9.923 -15.96803 24.97081 15.51758 10.4 29.7)"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#FFD580" />
                            <stop offset=".09" stopColor="#F6C592" />
                            <stop offset=".2" stopColor="#EBB6A2" />
                            <stop offset=".32" stopColor="#DFA5AF" />
                            <stop offset=".43" stopColor="#D397BE" />
                            <stop offset=".53" stopColor="#C486CB" />
                            <stop offset=".65" stopColor="#B578D9" />
                            <stop offset=".77" stopColor="#A166E5" />
                            <stop offset=".89" stopColor="#8B57F2" />
                            <stop offset="1" stopColor="#704CFF" />
                        </radialGradient>
                    </defs>
                </>
            )}
        </svg>
    );
};

export default PassLogo;
