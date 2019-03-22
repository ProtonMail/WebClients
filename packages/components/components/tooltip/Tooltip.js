import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import TooltipJs from 'tooltip.js';

const Tooltip = ({ title, placement, html, trigger, delay, children }) => {
    const tooltipRef = useRef(null);

    useEffect(() => {
        const tooltip = new TooltipJs(tooltipRef.current, {
            title,
            placement,
            html,
            trigger,
            delay
        });

        return () => {
            tooltip.dispose();
        };
    }, []);

    return (
        <span className="Tooltip" ref={tooltipRef}>
            {children}
        </span>
    );
};

Tooltip.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    placement: PropTypes.string,
    html: PropTypes.bool,
    trigger: PropTypes.string,
    delay: PropTypes.number
};

Tooltip.defaultProps = {
    placement: 'top',
    html: false,
    trigger: 'hover focus',
    delay: 0
};

export default Tooltip;
