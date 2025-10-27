import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getInboxDesktopInfo, invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import clsx from '@proton/utils/clsx';

import TopBanner from '../../topBanners/TopBanner';
import { useElectronDefaultApp } from './useElectronDefaultApp';

interface Props {
    className?: string;
}

export const InboxDesktopDefaultAppTopBanner = ({ className }: Props) => {
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
            <TopBanner className={clsx('bg-info', className)} onClose={onClose}>
                {c('Info').t`Make ${MAIL_APP_NAME} your default email application.`}{' '}
                <InlineLinkButton onClick={triggerPrompt}>{c('Action').t`Set as default`}</InlineLinkButton>
            </TopBanner>

            {Prompt}
        </>
    );
};
export default InboxDesktopDefaultAppTopBanner;
