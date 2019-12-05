import { Label, LinkButton, Row } from 'react-components';
import { c } from 'ttag';
import React from 'react';

const MoreRow = ({ children, displayMore = true, collapseOnMobile, hasMore, onChange }) => {
    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label> </Label>
            <div className="flex-item-fluid">
                <div className="flex flex-spacebetween flex-nowrap flex-items-center">
                    {children}
                    {displayMore ? (
                        <LinkButton onClick={() => onChange(!hasMore)}>
                            {hasMore ? c('Action').t`Fewer options` : c('Action').t`More options`}
                        </LinkButton>
                    ) : null}
                </div>
            </div>
        </Row>
    )
};

export default MoreRow;
