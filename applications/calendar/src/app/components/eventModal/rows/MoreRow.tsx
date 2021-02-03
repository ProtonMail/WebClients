import { Label, LinkButton, Row } from 'react-components';
import { c } from 'ttag';
import React from 'react';

interface Props {
    children?: React.ReactNode;
    displayMore?: boolean;
    moreText?: string;
    lessText?: string;
    collapseOnMobile?: boolean;
    hasMore?: boolean;
    onChange: (value: boolean) => void;
}
const MoreRow = ({
    children,
    displayMore = true,
    moreText = c('Action').t`More options`,
    lessText = c('Action').t`Fewer options`,
    collapseOnMobile,
    hasMore,
    onChange,
}: Props) => {
    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label> </Label>
            <div className="flex-item-fluid">
                <div className="flex flex-justify-space-between flex-nowrap flex-align-items-center">
                    {children}
                    {displayMore ? (
                        <LinkButton onClick={() => onChange(!hasMore)}>{hasMore ? lessText : moreText}</LinkButton>
                    ) : null}
                </div>
            </div>
        </Row>
    );
};

export default MoreRow;
