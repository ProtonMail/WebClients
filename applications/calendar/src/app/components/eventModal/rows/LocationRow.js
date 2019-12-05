import React from 'react';
import { Label, Row } from 'react-components';
import LocationInput from '../inputs/LocationInput';

const LocationRow = ({ label, collapseOnMobile, ...rest }) => {
    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label htmlFor="event-location-input">{label}</Label>
            <div className="flex-item-fluid">
                <LocationInput id="event-location-input" {...rest} />
            </div>
        </Row>
    );
};

export default LocationRow;
