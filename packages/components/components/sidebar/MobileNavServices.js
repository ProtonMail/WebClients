import React from 'react';
import PropTypes from 'prop-types';
import { useActiveBreakpoint } from 'react-components';
import { isMobile } from 'proton-shared/lib/helpers/responsive';

const MobileNavServices = ({ children }) => {
    const breakpoint = useActiveBreakpoint();

    if (!isMobile(breakpoint)) {
        return null;
    }

    return <nav className="p1 flex flex-row flex-spacearound flex-item-noshrink bg-global-grey">{children}</nav>;
};

MobileNavServices.propTypes = {
    children: PropTypes.node.isRequired
};

export default MobileNavServices;
