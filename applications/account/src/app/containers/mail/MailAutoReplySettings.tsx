import React from 'react';
import { c } from 'ttag';

import { AutoReplySection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getAutoReply = () => {
    return {
        text: c('Title').t`Auto reply`,
        to: '/mail/auto-reply',
        icon: 'mailbox',
        subsections: [{ id: 'auto-reply' }],
    };
};

const MailAutoReplySettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions location={location} config={getAutoReply()}>
            <AutoReplySection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailAutoReplySettings;
