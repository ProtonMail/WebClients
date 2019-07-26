import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { generateUID } from '../../helpers/component';
import { calculateAdjustedPosition } from './utils';

const Tooltip = ({ children, title, placement, scrollContainerClass }) => {
    const tooltipRef = useRef();
    const wrapperRef = useRef();
    const [uid] = useState(generateUID('tooltip'));
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: -1000, left: -1000, placement });

    useEffect(() => {
        const updatePosition = () => {
            if (visible && wrapperRef.current && tooltipRef.current) {
                const targetBounds = wrapperRef.current.getBoundingClientRect();
                const tooltipBounds = tooltipRef.current.getBoundingClientRect();
                setPosition(calculateAdjustedPosition(targetBounds, tooltipBounds, placement));
            } else {
                setPosition({ top: -1000, left: -1000, placement });
            }
        };

        updatePosition();

        if (visible) {
            const contentArea = document.getElementsByClassName(scrollContainerClass)[0] || document.body;
            contentArea.addEventListener('scroll', updatePosition);
            return () => contentArea.removeEventListener('scroll', updatePosition);
        }
    }, [visible, wrapperRef.current, tooltipRef.current]);

    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    const { top, left, placement: adjustedPlacement } = position;

    return (
        <span className="tooltip-container" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
            <span ref={wrapperRef} aria-describedby={uid}>
                {children}
            </span>
            {ReactDOM.createPortal(
                <span
                    ref={tooltipRef}
                    style={{ top, left }}
                    className={`tooltip-${adjustedPlacement}`}
                    id={uid}
                    role="tooltip"
                    aria-hidden={!visible}
                >
                    {title}
                </span>,
                document.body
            )}
        </span>
    );
};

Tooltip.propTypes = {
    placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    title: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    scrollContainerClass: PropTypes.string
};

Tooltip.defaultProps = {
    placement: 'top',
    scrollContainerClass: 'main'
};

export default Tooltip;
