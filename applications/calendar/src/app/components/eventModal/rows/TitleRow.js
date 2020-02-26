import React from 'react';
import { Label, Row } from 'react-components';
import TitleInput from '../inputs/TitleInput';

export const TITLE_INPUT_ID = 'event-title-input';

const TitleRow = ({ label, collapseOnMobile, ...rest }) => {
    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label htmlFor={TITLE_INPUT_ID}>{label}</Label>
            <div className="flex-item-fluid">
                <TitleInput id={TITLE_INPUT_ID} {...rest} />
            </div>
        </Row>
    );
};

export default TitleRow;
