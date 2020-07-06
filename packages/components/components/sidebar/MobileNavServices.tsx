import React from 'react';
import { useActiveBreakpoint } from '../../index';

interface Props {
    children: React.ReactNode;
}
const MobileNavServices = ({ children }: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    if (!isNarrow) {
        return null;
    }

    return <nav className="p1 flex flex-row flex-spacearound flex-item-noshrink bg-global-grey">{children}</nav>;
};

export default MobileNavServices;
