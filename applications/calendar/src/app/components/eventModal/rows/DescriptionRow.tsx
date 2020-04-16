import React from 'react';
import { Label, Row } from 'react-components';
import DescriptionInput, { Props as DescriptionInputProps } from '../inputs/DescriptionInput';

interface Props extends DescriptionInputProps {
    label: React.ReactNode;
    collapseOnMobile?: boolean;
}

const DescriptionRow = ({ label, collapseOnMobile, ...rest }: Props) => {
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
