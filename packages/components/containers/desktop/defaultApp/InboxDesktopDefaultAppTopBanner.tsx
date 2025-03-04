import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getInboxDesktopInfo, invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

import TopBanner from '../../topBanners/TopBanner';
import { useElectronDefaultApp } from './useElectronDefaultApp';

export const InboxDesktopDefaultAppTopBanner = () => {
    const { enabled, isDefault, shouldCheck, triggerPrompt, Prompt } = useElectronDefaultApp();
    const [showBanner, setShowBanner] = useState(false);

    const onClose = () => {
        void invokeInboxDesktopIPC({ type: 'setDefaultMailtoBannerDismissed', payload: true });
        setShowBanner(false);
    };

    useEffect(() => {
        if (!enabled) {
            return;
        }

        setShowBanner(!isDefault && !getInboxDesktopInfo('defaultMailtoBannerDismissed') && shouldCheck);
    }, [enabled, shouldCheck, isDefault]);

    if (!enabled || !showBanner) {
        return null;
    }

    return (
        <>
            <TopBanner className="bg-info" onClose={onClose}>
                {c('Info').t`Make ${MAIL_APP_NAME} your default email application.`}{' '}
                <InlineLinkButton onClick={triggerPrompt}>{c('Action').t`Set as default`}</InlineLinkButton>
            </TopBanner>

            {Prompt}
        </>
    );
};
export default InboxDesktopDefaultAppTopBanner;
