import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID } from '../../helpers/component';

const Tooltip = ({ title, children, placement }) => {
    const [uid] = useState(generateUID('tooltip'));
    const [show, setShow] = useState(false);

    return (
        <span
            className="tooltip-container"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            onFocus={() => setShow(true)}
            onBlur={() => setShow(false)}
        >
            <span aria-describedby={uid}>{children}</span>
            <span className={`tooltip-${placement}`} id={uid} role="tooltip" aria-hidden={!show}>
                {title}
            </span>
        </span>
    );
};

Tooltip.propTypes = {
    title: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']).isRequired
};

Tooltip.defaultProps = {
    placement: 'top'
};

export default Tooltip;
