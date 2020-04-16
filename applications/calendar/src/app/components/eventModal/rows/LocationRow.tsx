import React from 'react';
import { Label, Row } from 'react-components';
import LocationInput, { Props as LocationInputProps } from '../inputs/LocationInput';

interface Props extends LocationInputProps {
    label: React.ReactNode;
    collapseOnMobile?: boolean;
}

const LocationRow = ({ label, collapseOnMobile, ...rest }: Props) => {
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
