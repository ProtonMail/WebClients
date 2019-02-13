import React, { useState, useEffect, useRef } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '../button/Button';

const Dropdown = ({ history, isOpen, children, className, content, autoClose }) => {
    const [open, setOpen] = useState(isOpen);
    const handleClick = () => setOpen(!open);
    const wrapperRef = useRef(null);
    const onRouteChange = () => setOpen(false);

    const handleClickOutside = (event) => {
        if (autoClose && !wrapperRef.current.contains(event.target)) {
            setOpen(false);
        }
    };

    useEffect(() => {
        const unlisten = history.listen(onRouteChange);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            unlisten();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="dropDown" ref={wrapperRef}>
            <Button className={className} onClick={handleClick} aria-expanded={open}>{content}</Button>
            {open ? children : null}
        </div>
    );
};

Dropdown.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    history: PropTypes.object.isRequired,
    content: PropTypes.node,
    isOpen: PropTypes.bool,
    autoClose: PropTypes.bool
};

Dropdown.defaultProps = {
    isOpen: false,
    autoClose: true
};

export default withRouter(Dropdown);
