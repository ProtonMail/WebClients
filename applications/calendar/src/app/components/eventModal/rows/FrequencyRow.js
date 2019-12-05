import React from 'react';
import { Label, Row } from 'react-components';
import FrequencyInput from '../inputs/FrequencyInput';

const FrequencyRow = ({ label, ...rest }) => {
    return (
        <Row>
            <Label htmlFor="event-frequency-select">{label}</Label>
            <div className="flex flex-nowrap flex-item-fluid">
                <FrequencyInput id="event-frequency-select" {...rest} />
            </div>
        </Row>
    );
};

export default FrequencyRow;
