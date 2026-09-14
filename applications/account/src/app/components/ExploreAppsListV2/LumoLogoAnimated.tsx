import { useState } from 'react';

import type { LogoProps } from '@proton/components/components/logo/LogoBase';
import LogoBase from '@proton/components/components/logo/LogoBase';
import { LUMO_APP_NAME } from '@proton/shared/lib/constants';
import generateUID from '@proton/utils/generateUID';

const LumoLogo = ({ variant = 'with-wordmark', hasTitle = true, ...rest }: LogoProps) => {
    const [uid] = useState(generateUID('lumologo'));

    if (variant === 'glyph-only') {
        const logoWidth = 36;
        const logoHeight = 36;
        return (
            <LogoBase
                uid={uid}
                logoWidth={logoWidth}
                logoHeight={logoHeight}
                viewBox="0 0 36 36"
                title={hasTitle ? LUMO_APP_NAME : undefined}
                variant={variant}
                {...rest}
            >
                <style>
                    {`
                    .explore-app-proton-lumo .${uid}-show-on-hover, .explore-app-proton-lumo .${uid}-hide-on-hover {
                        transition: all .2s ease;
                    }
                    .explore-app-proton-lumo .${uid}-show-on-hover {
                        opacity: 0;
                    }
                    .explore-app-proton-lumo:hover .${uid}-hide-on-hover {
                        opacity: 0;
                    }
                    .explore-app-proton-lumo:hover .${uid}-show-on-hover {
                        opacity: 1;
                    }
                    `}
                </style>

                <g id={uid}>
                    <path
                        fill="#4129a3"
                        d="M26.426 27.74c0 .452-.288.858-.717.996-3.195 1.033-6.225 1.168-7.571 1.168-1.713 0-4.618-.162-7.555-1.059a1.04 1.04 0 0 1-.735-1.001V24.91h16.578v2.832z"
                    />
                    <path fill="#ffac2e" d="M18.14 33.63a2.254 2.254 0 1 1 0-4.509 2.254 2.254 0 0 1 0 4.508" />
                    <path
                        fill="#372580"
                        d="M18.14 30.345a.698.698 0 0 0-.326 1.32v.476a.326.326 0 1 0 .651 0v-.477a.698.698 0 0 0-.324-1.32"
                    />
                    <path
                        fill="#6d4aff"
                        d="M30.253 12.854 22.425 6.57l4.845-3.177a1.568 1.568 0 0 1 2.408 1.141l.573 8.321zM5.746 12.854l7.828-6.285L8.73 3.392A1.567 1.567 0 0 0 6.32 4.533l-.574 8.321z"
                    />
                    <path
                        fill="#4a2dc5"
                        d="m9.359 6.953 1.616 1.038L8.34 9.762l.32-2.484a.455.455 0 0 1 .697-.325zM26.64 6.953 25.024 7.99l2.635 1.771-.32-2.484a.455.455 0 0 0-.698-.325z"
                    />
                    <path
                        fill="#6d4aff"
                        d="M4.067 18.61c0 6.402 7.596 8.684 13.933 8.684 5.57 0 13.934-2.282 13.934-8.683 0-6.402-6.24-12.872-13.934-12.872-7.695 0-13.933 6.47-13.933 12.872"
                    />
                    <path
                        fill="#fff"
                        d="M17.79 21.093a.232.232 0 0 0 0 .463c.485 0 .876.392.876.875 0 .127.104.231.231.231h.004a.23.23 0 0 0 .231-.231c0-.483.391-.875.875-.875a.232.232 0 0 0 0-.463c-.461 0-.868.233-1.108.587a1.34 1.34 0 0 0-1.108-.587M24.256 13.64c2.668-.96 4.606.568 5.396 1.375.271.278.413.662.38 1.05-.089 1.102-.596 3.43-3.236 4.422-2.674.96-4.593-.51-5.371-1.284a1.3 1.3 0 0 1-.38-1.004c.071-1.117.54-3.556 3.21-4.56"
                    />
                    <path
                        fill="#372480"
                        d="M21.024 18.175c.175-1.079.594-2.087 1.278-2.851 1.366-1.502 3.686-2.116 5.582-1.33.474.196.93.462 1.343.791.428.312.784.723.833 1.279.107-.571-.215-1.122-.606-1.521a5 5 0 0 0-1.343-1.034c-1.543-.84-3.507-.63-4.965.302-1.47.885-2.323 2.705-2.122 4.364"
                    />
                    <path
                        fill="#fff"
                        d="M13.385 13.64c-2.668-.96-4.606.568-5.396 1.375a1.35 1.35 0 0 0-.38 1.05c.088 1.102.596 3.43 3.235 4.422 2.675.96 4.594-.51 5.372-1.284.266-.264.402-.63.38-1.004-.072-1.117-.54-3.556-3.21-4.56"
                    />
                    <path
                        fill="#372480"
                        d="M16.614 18.175c.2-1.657-.652-3.479-2.122-4.364-1.456-.933-3.422-1.142-4.965-.302-.51.265-.961.623-1.343 1.034-.391.397-.714.95-.606 1.52.049-.555.403-.965.833-1.278a5.6 5.6 0 0 1 1.343-.791c1.896-.786 4.216-.172 5.582 1.33.684.764 1.103 1.772 1.278 2.85"
                    />
                    <g id="eye-left-1" className={`${uid}-hide-on-hover`}>
                        <path
                            fill="#4129a3"
                            d="M12.713 19.767c-.697 0-1.262-1.081-1.262-2.415s.565-2.415 1.262-2.415c.696 0 1.26 1.081 1.26 2.415s-.564 2.415-1.26 2.415"
                        />
                        <path
                            fill="#fff"
                            d="M11.786 16.244a.574.574 0 1 1 0-1.147.574.574 0 0 1 0 1.147"
                            opacity=".7"
                        />
                    </g>
                    <g id="eye-right-1" className={`${uid}-hide-on-hover`}>
                        <path
                            fill="#4129a3"
                            d="M25.826 19.767c-.696 0-1.261-1.081-1.261-2.415s.565-2.415 1.261-2.415c.697 0 1.261 1.081 1.261 2.415s-.564 2.415-1.26 2.415"
                        />
                        <path fill="#fff" d="M24.9 16.244a.574.574 0 1 1 0-1.147.574.574 0 0 1 0 1.147" opacity=".7" />
                    </g>
                    <g id="eye-left-2" className={`${uid}-show-on-hover`}>
                        <path
                            fill="#4129a3"
                            d="M10.59 19.672c-.696 0-1.26-1.082-1.26-2.416s.564-2.416 1.26-2.416 1.262 1.082 1.262 2.416-.565 2.416-1.261 2.416"
                        />
                        <path fill="#fff" d="M9.663 16.149a.574.574 0 1 1 0-1.15.574.574 0 0 1 0 1.15" opacity=".7" />
                    </g>
                    <g id="eye-right-2" className={`${uid}-show-on-hover`}>
                        <path
                            fill="#4129a3"
                            d="M23.736 19.672c-.696 0-1.261-1.082-1.261-2.416s.565-2.416 1.261-2.416c.697 0 1.262 1.082 1.262 2.416s-.565 2.416-1.262 2.416"
                        />
                        <path
                            fill="#fff"
                            d="M22.854 16.149a.574.574 0 1 1 0-1.149.574.574 0 0 1 0 1.149"
                            opacity=".7"
                        />
                    </g>
                </g>
            </LogoBase>
        );
    }
};

export default LumoLogo;
