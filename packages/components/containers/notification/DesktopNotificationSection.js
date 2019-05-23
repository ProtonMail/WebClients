import React from 'react';
import { SubTitle, Row, Field, Label, Info } from 'react-components';
import DesktopNotificationPanel from './DesktopNotificationPanel';
import { c } from 'ttag';

const DesktopNotificationSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Desktop notification`}</SubTitle>
            <Row>
                <Label>
                    <span className="mr0-5">{c('Label').t`Desktop notification`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/desktop-notifications/" />
                </Label>
                <Field className="w100">
                    <DesktopNotificationPanel />
                </Field>
            </Row>
        </>
    );
};

export default DesktopNotificationSection;
