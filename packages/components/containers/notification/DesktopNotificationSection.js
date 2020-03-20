import React from 'react';
import { SubTitle, Row, Label, Info } from 'react-components';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import DesktopNotificationPanel from './DesktopNotificationPanel';

const DesktopNotificationSection = ({ onTest }) => {
    return (
        <>
            <SubTitle>{c('Title').t`Desktop notification`}</SubTitle>
            <Row>
                <Label>
                    <span className="mr0-5">{c('Label').t`Desktop notification`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/desktop-notifications/" />
                </Label>
                <DesktopNotificationPanel onTest={onTest} />
            </Row>
        </>
    );
};

DesktopNotificationSection.propTypes = {
    onTest: PropTypes.func
};

export default DesktopNotificationSection;
