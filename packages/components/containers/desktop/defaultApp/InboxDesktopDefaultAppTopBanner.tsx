import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import TopBanner from '../../topBanners/TopBanner';
import { useElectronDefaultApp } from './useElectronDefaultApp';

export const InboxDesktopDefaultAppTopBanner = () => {
    const { enabled, isDefault, shouldCheck, triggerPrompt, Prompt } = useElectronDefaultApp();
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        setShowBanner(!isDefault && shouldCheck);
    }, [shouldCheck, isDefault]);

    if (!enabled || !showBanner) {
        return null;
    }

    return (
        <>
            <TopBanner className="bg-info" onClose={() => setShowBanner(false)}>
                {c('Info').t`${MAIL_APP_NAME} is not your default mail application.`}{' '}
                <InlineLinkButton onClick={triggerPrompt}>{c('Action')
                    .t`Set as default mail application`}</InlineLinkButton>
            </TopBanner>

            {Prompt}
        </>
    );
};
export default InboxDesktopDefaultAppTopBanner;
