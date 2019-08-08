import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';
import { classnames } from '../../helpers/component';
import { usePopper, Popper } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import { noop } from 'proton-shared/lib/helpers/function';

const Dropdown = ({
    anchorRef,
    children,
    originalPlacement = 'bottom',
    onClose = noop,
    isOpen = false,
    narrow = false,
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
        offset: 20,
        scrollContainerClass: 'main'
    });

    const handleKeydown = (event) => {
        const key = keycode(event);

        if (key === 'escape' && event.target === document.activeElement) {
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
    }, []);

    const contentClassName = classnames(['dropDown', `dropDown--${placement}`, narrow && 'dropDown--narrow']);
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
    anchorRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    isOpen: PropTypes.bool,
    originalPlacement: PropTypes.string,
    narrow: PropTypes.bool,
    autoClose: PropTypes.bool,
    autoCloseOutside: PropTypes.bool
};

export default Dropdown;
