import React from 'react';
import { Label, Row } from 'react-components';
import DescriptionInput from '../inputs/DescriptionInput';

const DescriptionRow = ({ label, collapseOnMobile, ...rest }) => {
    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label htmlFor="event-description-input">{label}</Label>
            <div className="flex-item-fluid">
                <DescriptionInput id="event-description-input" {...rest} />
            </div>
        </Row>
    );
};

export default DescriptionRow;
