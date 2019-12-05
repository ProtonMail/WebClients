import { Select } from 'react-components';
import React from 'react';
import CalendarIcon from '../../calendar/CalendarIcon';

const CalendarSelect = ({ withIcon, value: { color, id }, options, onChange, ...rest }) => {
    return (
        <>
            {!withIcon ? <CalendarIcon className="mr1" color={color} /> : null}
            <Select
                options={options}
                onChange={({ target }) => onChange(options[target.selectedIndex])}
                value={id}
                {...rest}
            />
        </>
    );
};

export default CalendarSelect;
