import React from 'react';
import { c } from 'ttag';
import { SettingsParagraph, SettingsSectionWide } from '../account';

const CatchAllSection = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/catch-all/">
                {c('Info')
                    .t`If you have a custom domain with ProtonMail, you can set a catch-all email address that will receive messages sent to your domain but to an invalid email address (e.g., typos).`}
            </SettingsParagraph>
        </SettingsSectionWide>
    );
};

export default CatchAllSection;
