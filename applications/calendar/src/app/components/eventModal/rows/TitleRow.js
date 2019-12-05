import React from 'react';
import { Label, Row } from 'react-components';
import TitleInput from '../inputs/TitleInput';

const TitleRow = ({ label, collapseOnMobile, ...rest }) => {
    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label htmlFor="event-title-input">{label}</Label>
            <div className="flex-item-fluid">
                <TitleInput
                    id="event-title-input"
                    {...rest}
                />
            </div>
        </Row>
    )
};

export default TitleRow;
