import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';
import { Icon } from 'react-components';

const ALIGN_CLASSES = {
    right: 'dropDown--rightArrow',
    left: 'dropDown--leftArrow'
};

const Dropdown = ({
    isOpen,
    content,
    title,
    children,
    className,
    autoClose,
    autoCloseOutside,
    align,
    narrow,
    loading,
    disabled,
    caret
}) => {
    const [open, setOpen] = useState(isOpen);
    const wrapperRef = useRef(null);

    const handleClick = () => setOpen(!open);

    const handleKeydown = (event) => {
        const key = keycode(event);

        if (key === 'escape' && event.target === document.activeElement) {
            setOpen(false);
        }
    };

    const handleClickOutside = (event) => {
        // Do nothing if clicking ref's element or descendent elements
        if (!autoCloseOutside || !wrapperRef.current || wrapperRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };

    const handleClickContent = () => {
        if (autoClose) {
            setOpen(false);
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

    const alignClass = ALIGN_CLASSES[align];
    const dropdownClassName = ['dropDown pm-button', alignClass, (loading || disabled) && 'is-disabled', className]
        .filter(Boolean)
        .join(' ');
    const contentClassName = `dropDown-content ${narrow ? 'dropDown-content--narrow' : ''}`;
    const caretContent = caret && <Icon className="expand-caret" size={12} name="caret" />;

    return (
        <div className={`${dropdownClassName} ${className}`} ref={wrapperRef}>
            <button
                title={title}
                className="increase-surface-click"
                aria-expanded={open}
                aria-busy={loading}
                onClick={handleClick}
                type="button"
                disabled={loading || disabled}
            >
                <span className="mauto">
                    {content} {caretContent}
                </span>
            </button>
            <div className={contentClassName} onClick={handleClickContent} hidden={!open}>
                {children}
            </div>
        </div>
    );
};

Dropdown.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    content: PropTypes.node.isRequired,
    isOpen: PropTypes.bool,
    align: PropTypes.string,
    title: PropTypes.string,
    caret: PropTypes.bool,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    narrow: PropTypes.bool,
    autoClose: PropTypes.bool,
    autoCloseOutside: PropTypes.bool
};

Dropdown.defaultProps = {
    isOpen: false,
    autoClose: true,
    align: 'center',
    narrow: false,
    caret: false,
    disabled: false,
    loading: false,
    autoCloseOutside: true,
    className: ''
};

export default Dropdown;
