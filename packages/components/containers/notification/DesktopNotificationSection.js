import React from 'react';
import { SubTitle, Row, Label } from 'react-components';
import DesktopNotificationPanel from './DesktopNotificationPanel';
import { c } from 'ttag/types';

const DesktopNotificationSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Desktop notification`}</SubTitle>
            <Row>
                <Label>{c('Label').t`Desktop notification`}</Label>
                <DesktopNotificationPanel />
            </Row>
        </>
    );
};

export default DesktopNotificationSection;
