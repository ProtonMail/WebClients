import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Pikaday from 'pikaday';

const MiniCalendar = ({ ...rest }) => {
    const inputRef = useRef();
    const containerRef = useRef();

    useEffect(() => {
        const picker = new Pikaday({
            field: inputRef.current,
            container: containerRef.current,
            bound: false,
            ...rest
        });

        return () => picker.destroy();
    });

    return (
        <>
            <input className="hidden" ref={inputRef} />
            <div ref={containerRef} />
        </>
    );
};

MiniCalendar.propTypes = {};

export default MiniCalendar;
