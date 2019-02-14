import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from '../button/Button';

const Dropdown = ({ isOpen, children, className, content, autoClose, autoCloseOutside }) => {
    const [open, setOpen] = useState(isOpen);
    const handleClick = () => setOpen(!open);
    const wrapperRef = useRef(null);

    const handleClickOutside = (event) => {
        if (autoCloseOutside && !wrapperRef.current.contains(event.target)) {
            setOpen(false);
        }
    };

    const handleClickContent = () => {
        if (autoClose) {
            setOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="dropDown" ref={wrapperRef}>
            <Button className={className} onClick={handleClick} aria-expanded={open}>{content}</Button>
            {open ? <div className="dropDown-content" onClick={handleClickContent}>{children}</div> : null}
        </div>
    );
};

Dropdown.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    content: PropTypes.node,
    isOpen: PropTypes.bool,
    autoClose: PropTypes.bool,
    autoCloseOutside: PropTypes.bool
};

Dropdown.defaultProps = {
    isOpen: false,
    autoClose: true,
    autoCloseOutside: true
};

export default Dropdown;
