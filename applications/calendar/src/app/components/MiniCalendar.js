import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Pikaday from 'pikaday';

const MiniCalendar = ({ date, ...rest }) => {
    const inputRef = useRef();
    const containerRef = useRef();
    const pickerRef = useRef();

    useEffect(() => {
        pickerRef.current = new Pikaday({
            field: inputRef.current,
            container: containerRef.current,
            bound: false,
            ...rest
        });

        return () => pickerRef.current.destroy();
    });

    useEffect(() => {
        pickerRef.current.setDate(date, true);
    }, [date]);

    return (
        <>
            <input className="hidden" ref={inputRef} />
            <div ref={containerRef} />
        </>
    );
};

MiniCalendar.propTypes = {
    date: PropTypes.instanceOf(Date)
};

export default MiniCalendar;
