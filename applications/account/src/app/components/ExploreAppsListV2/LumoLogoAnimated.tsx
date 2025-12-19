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
                        fill="#6D4AFF"
                        d="m22.669 7.465 3.343-2.163c1.16-.75 2.698-.027 2.874 1.35l.81 6.348-7.029-5.535h.002Zm-9.079 0-3.344-2.163c-1.16-.75-2.698-.027-2.874 1.35L6.563 13l7.029-5.535h-.002Z"
                    />
                    <path
                        fill="#4A2DC5"
                        d="m9.322 7.853 1.623 1.052-2.647 1.792.32-2.515a.457.457 0 0 1 .702-.329h.002Zm17.368 0-1.624 1.052 2.647 1.792-.32-2.515a.458.458 0 0 0-.703-.329Z"
                    />
                    <path fill="#4129A3" d="M27.017 25.377H8.98v4.756h18.037v-4.756Z" />
                    <path
                        fill="#FC8F00"
                        d="M18.475 34.523c1.667 0 3.019-1.361 3.019-3.04 0-1.68-1.352-3.042-3.019-3.042s-3.019 1.362-3.019 3.04c0 1.68 1.351 3.042 3.019 3.042Z"
                    />
                    <path fill="#FC8F00" d="M17.35 34.525h1.156v-6.08H17.35v6.08Z" />
                    <path
                        fill="#FFAC2E"
                        d="M17.347 34.523c1.667 0 3.018-1.361 3.018-3.04 0-1.68-1.351-3.042-3.018-3.042-1.667 0-3.019 1.362-3.019 3.04 0 1.68 1.352 3.042 3.019 3.042Z"
                    />
                    <path
                        fill="#372580"
                        d="M17.343 30.09a.945.945 0 0 1 .87.586c.047.114.07.237.07.361a.942.942 0 0 1-.459.81v.673a.48.48 0 0 1-.96 0v-.672a.945.945 0 0 1-.388-1.172.942.942 0 0 1 .867-.585Z"
                    />
                    <path
                        fill="#6D4AFF"
                        d="M32 19.653c0 6.48-7.633 8.789-14 8.789-5.596 0-14-2.31-14-8.79 0-6.479 6.268-13.028 14-13.028s14 6.55 14 13.029Z"
                    />
                    <path
                        fill="#fff"
                        d="M24.865 21.767c2.315-1.006 3.473-3.499 2.587-5.569-.886-2.07-3.48-2.932-5.796-1.926-2.315 1.005-3.473 3.5-2.587 5.568.886 2.07 3.481 2.933 5.796 1.927ZM14.44 19.84c.887-2.07-.272-4.563-2.587-5.569-2.315-1.006-4.91-.143-5.796 1.927-.886 2.07.272 4.563 2.587 5.57 2.315 1.004 4.91.142 5.797-1.928h-.001Z"
                    />
                    <path
                        fill="#372480"
                        d="M14.577 17.268c-1.272-3.114-5.925-4.304-8.017-1.437-.652.91-.81 2.087-.558 3.192-.89-1.68-.217-3.84 1.384-4.82 2.617-1.724 6.671-.06 7.19 3.066h.001Zm4.357 0c.52-3.128 4.574-4.789 7.19-3.068 1.602.982 2.274 3.142 1.384 4.821.255-1.103.095-2.282-.558-3.192-2.092-2.867-6.744-1.676-8.016 1.438Z"
                    />
                    <path
                        fill="#fff"
                        d="M15.354 21.882c.393 0 .713.322.713.72 0 .117.094.212.21.212a.212.212 0 0 0 .207-.17l.017-.182a.722.722 0 0 1 .7-.58.212.212 0 0 0 0-.424 1.144 1.144 0 0 0-.924.476 1.131 1.131 0 0 0-.923-.476.212.212 0 1 0 0 .424Z"
                    />
                    <g id="eye-right-1" className={`${uid}-hide-on-hover`}>
                        <path
                            fill="#4129A3"
                            d="M23.502 20.546c.844 0 1.528-1.123 1.528-2.508 0-1.386-.684-2.51-1.528-2.51s-1.528 1.124-1.528 2.51c0 1.385.684 2.508 1.528 2.508Z"
                        />
                        <path
                            fill="#fff"
                            opacity=".7"
                            d="M24.43 16.983c.319 0 .577-.26.577-.58a.58.58 0 0 0-.577-.582.579.579 0 0 0-.576.58c0 .32.258.582.576.582Z"
                        />
                    </g>
                    <g id="eye-left-1" className={`${uid}-hide-on-hover`}>
                        <path
                            fill="#4129A3"
                            d="M10.32 20.546c.845 0 1.529-1.123 1.529-2.508 0-1.386-.684-2.51-1.528-2.51s-1.528 1.124-1.528 2.51c0 1.385.684 2.508 1.528 2.508h-.001Z"
                        />
                        <path
                            fill="#fff"
                            opacity=".7"
                            d="M11.249 16.983c.318 0 .576-.26.576-.58a.579.579 0 0 0-.797-.537.579.579 0 0 0-.356.536c0 .32.258.58.577.58Z"
                        />
                    </g>
                    <g id="eye-right-2" opacity="0" className={`${uid}-show-on-hover`}>
                        <path
                            fill="#4129A3"
                            d="M24.966 20.521c.843 0 1.527-1.114 1.527-2.49 0-1.374-.684-2.489-1.527-2.489-.844 0-1.528 1.115-1.528 2.49 0 1.375.684 2.49 1.528 2.49Z"
                        />
                        <path
                            fill="#fff"
                            opacity=".7"
                            d="M25.897 16.982a.577.577 0 1 0 0-1.153.577.577 0 0 0 0 1.153Z"
                        />
                    </g>
                    <g id="eye-left-2" opacity="0" className={`${uid}-show-on-hover`}>
                        <path
                            fill="#4129A3"
                            d="M11.793 20.521c.844 0 1.527-1.114 1.527-2.49 0-1.374-.684-2.489-1.527-2.489-.844 0-1.528 1.115-1.528 2.49 0 1.375.684 2.49 1.528 2.49Z"
                        />
                        <path
                            fill="#fff"
                            opacity=".7"
                            d="M12.725 16.982a.577.577 0 1 0 0-1.153.577.577 0 0 0 0 1.153Z"
                        />
                    </g>
                </g>
            </LogoBase>
        );
    }
};

export default LumoLogo;
