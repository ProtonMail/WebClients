import React from 'react';
import { c } from 'ttag';
import { SettingsParagraph, SettingsSectionWide } from '../account';

const CatchAllSection = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/catch-all/">
                {c('Info')
                    .t`Catch-All provides ProtonMail Custom Domain users the option to receive all mail sent to their domain, even if it was sent to an email address that has not been set up within their account. To set a catch-all email address, open the dropdown action menu of your custom domain and click on Set catch-all.`}
            </SettingsParagraph>
        </SettingsSectionWide>
    );
};

export default CatchAllSection;
