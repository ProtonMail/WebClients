import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';
import { usePopper, Popper } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import { noop } from 'proton-shared/lib/helpers/function';
import { ALL_PLACEMENTS } from '../popper/utils';

/** @type any */
const Dropdown = ({
    anchorRef,
    children,
    className,
    originalPlacement = 'bottom',
    availablePlacements = ALL_PLACEMENTS,
    onClose = noop,
    isOpen = false,
    size = 'normal',
    autoClose = true,
    autoCloseOutside = true,
    ...rest
}) => {
    const { isRTL } = useRightToLeft();
    const rtlAdjustedPlacement = originalPlacement.includes('right')
        ? originalPlacement.replace('right', 'left')
        : originalPlacement.replace('left', 'right');

    const popperRef = useRef();
    const { placement, position } = usePopper(popperRef, anchorRef, isOpen, {
        originalPlacement: isRTL ? rtlAdjustedPlacement : originalPlacement,
        availablePlacements,
        offset: 20,
        scrollContainerClass: 'main'
    });

    const handleKeydown = (event) => {
        if (event.key === 'Escape' && event.target === document.activeElement) {
            onClose();
        }
    };

    const handleClickOutside = (event) => {
        // Do nothing if clicking ref's element or descendent elements
        if (
            !autoCloseOutside ||
            (anchorRef.current && anchorRef.current.contains(event.target)) ||
            (popperRef.current && popperRef.current.contains(event.target))
        ) {
            return;
        }
        onClose();
    };

    const handleClickContent = () => {
        if (autoClose) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleKeydown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeydown);
        };
    }, [autoCloseOutside]);

    const contentClassName = classnames([
        'dropDown',
        `dropDown--${placement}`,
        size !== 'normal' && `dropDown--${size}`,
        className
    ]);
    return (
        <Popper
            ref={popperRef}
            position={position}
            isOpen={isOpen}
            role="dialog"
            className={contentClassName}
            onClick={handleClickContent}
            {...rest}
        >
            {children}
        </Popper>
    );
};

Dropdown.propTypes = {
    anchorRef: PropTypes.shape({ current: PropTypes.any }),
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClose: PropTypes.func,
    isOpen: PropTypes.bool,
    originalPlacement: PropTypes.string,
    availablePlacements: PropTypes.arrayOf(PropTypes.oneOf(ALL_PLACEMENTS)),
    size: PropTypes.oneOf(['normal', 'narrow', 'wide', 'auto']),
    autoClose: PropTypes.bool,
    autoCloseOutside: PropTypes.bool
};

export default Dropdown;
