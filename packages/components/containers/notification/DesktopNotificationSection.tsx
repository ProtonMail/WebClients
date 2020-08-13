import React from 'react';
import { c } from 'ttag';
import { Row, Label, Info } from '../../components';
import DesktopNotificationPanel, { Props } from './DesktopNotificationPanel';

const DesktopNotificationSection = ({ onTest }: Props) => {
    return (
        <Row>
            <Label>
                <span className="mr0-5">{c('Label').t`Desktop notification`}</span>
                <Info url="https://protonmail.com/support/knowledge-base/desktop-notifications/" />
            </Label>
            <DesktopNotificationPanel onTest={onTest} />
        </Row>
    );
};

export default DesktopNotificationSection;
