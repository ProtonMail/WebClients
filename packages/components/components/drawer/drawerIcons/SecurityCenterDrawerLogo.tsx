import React, { useState } from 'react';

import generateUID from '@proton/utils/generateUID';

import LogoBase from '../../logo/LogoBase';

const SecurityCenterDrawerLogo = () => {
    const [uid] = useState(generateUID('cal-logo'));

    return (
        <LogoBase logoWidth={20} logoHeight={20} variant="with-wordmark" uid={uid} focusable="false" aria-hidden="true">
            <defs>
                <linearGradient y2="1.01026" x2="0.33901" y1="0.01025" x1="0.33901" id="paint0_linear_32795_102417">
                    <stop stopColor="#C4B6FE" />
                    <stop stopColor="#8669FE" offset="1" />
                </linearGradient>
            </defs>
            <g>
                {/* eslint-disable */}
                <path
                    fill="#6D4AFF"
                    d="m0.875,10.9729l0,-7.1604c0,-0.4304 0.27543,-0.8125 0.68377,-0.9487l7.68377,-2.5612c0.20527,-0.0684 0.41887,-0.1026 0.63246,-0.1026l0,19.6038c-0.33463,0 -0.66926,-0.0838 -0.97129,-0.2516l-4.42821,-2.4602c-2.22226,-1.2345 -3.6005,-3.5769 -3.6005,-6.1191z"
                />
                <path
                    fill="url(#paint0_linear_32795_102417)"
                    d="m18.875,10.9729l0,-7.1604c0,-0.4304 -0.2754,-0.8125 -0.6838,-0.9487l-7.6837,-2.5612c-0.2053,-0.0684 -0.4189,-0.1026 -0.6325,-0.1026l0,19.6038c0.3346,0 0.6693,-0.0838 0.9713,-0.2516l4.4282,-2.4602c2.2223,-1.2345 3.6005,-3.5769 3.6005,-6.1191z"
                />
                {/* eslint-enable */}
            </g>
        </LogoBase>
    );
};

export default SecurityCenterDrawerLogo;
