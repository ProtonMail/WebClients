import React from 'react';
import './DayCheckbox.scss';

interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    id: string;
    dayLong: string;
    dayAbbreviation: string;
}

const DayCheckbox = ({ id, dayAbbreviation, dayLong, ...rest }: Props) => {
    return (
        <label htmlFor={id} className="mt0-5 inline-flex relative" title={dayLong}>
            <input id={id} type="checkbox" className="day-checkbox sr-only" {...rest} />
            <span className="pm-button day-icon flex-item-noshrink rounded50 flex">
                <span className="mauto" aria-hidden="true">
                    {dayAbbreviation}
                </span>
                <span className="sr-only">{dayLong}</span>
            </span>
        </label>
    );
};

export default DayCheckbox;
