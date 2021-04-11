import React from 'react';
import { useConfig } from '../../hooks';

import Logo, { LogoProps } from './Logo';

const MainLogo = (props: Omit<LogoProps, 'appName'>) => {
    const { APP_NAME } = useConfig();

    return <Logo appName={APP_NAME} {...props} />;
};

export default MainLogo;
