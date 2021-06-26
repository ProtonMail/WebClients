import React from 'react';
import { APPS } from '@proton/shared/lib/constants';

import { useConfig, useActiveBreakpoint } from '../../hooks';

interface Props {
    children: React.ReactNode;
}
const MobileNavServices = ({ children }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const { APP_NAME } = useConfig();

    if (!isNarrow || APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return null;
    }

    return <nav className="p1 flex flex-row flex-justify-space-around flex-item-noshrink bg-norm">{children}</nav>;
};

export default MobileNavServices;
