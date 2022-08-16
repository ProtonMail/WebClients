import { ComponentPropsWithoutRef } from 'react';

import './DrawerIcons.scss';

export interface DrawerIconsProps extends ComponentPropsWithoutRef<'div'> {}

const DrawerIcons = (props: DrawerIconsProps) => {
    return <DrawerIcons {...props} />;
};

export default DrawerIcons;
