import React from 'react';

import MinimalEventRow from './MinimalEventRow';
import { EventModelErrors } from '../../interfaces/EventModel';

const MinimalErrowRow = ({ errors }: { errors: EventModelErrors }) => {
    const errorText = errors?.notifications?.text && (
        <span className="color-global-warning">{errors.notifications.text}</span>
    );
    if (!errorText) {
        return null;
    }
    return (
        <MinimalEventRow>
            <div className="mr0-5">{errorText}</div>
        </MinimalEventRow>
    );
};

export default MinimalErrowRow;
