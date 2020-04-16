import React from 'react';
import { Label, Row } from 'react-components';
import TitleInput, { Props as TitleInputProps } from '../inputs/TitleInput';

export const TITLE_INPUT_ID = 'event-title-input';

interface Props extends TitleInputProps {
    label: React.ReactNode;
    collapseOnMobile?: boolean;
}

const TitleRow = ({ label, collapseOnMobile, ...rest }: Props) => {
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
