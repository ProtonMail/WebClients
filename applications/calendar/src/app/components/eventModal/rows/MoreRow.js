import { Label, LinkButton, Row } from 'react-components';
import { c } from 'ttag';
import React from 'react';

const MoreRow = ({
    children,
    displayMore = true,
    moreText = c('Action').t`More options`,
    lessText = c('Action').t`Fewer options`,
    collapseOnMobile,
    hasMore,
    onChange
}) => {
    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label> </Label>
            <div className="flex-item-fluid">
                <div className="flex flex-spacebetween flex-nowrap flex-items-center">
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
