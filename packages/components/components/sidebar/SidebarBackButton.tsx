import React from 'react';

import SidebarPrimaryButton from './SidebarPrimaryButton';
import { Props as ButtonProps } from '../button/Button';

const SidebarBackButton = ({ children, ...rest }: ButtonProps) => {
    return <SidebarPrimaryButton {...rest}>{children}</SidebarPrimaryButton>;
};

export default SidebarBackButton;
