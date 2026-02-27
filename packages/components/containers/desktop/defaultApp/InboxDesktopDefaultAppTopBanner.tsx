import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import {
    getInboxDesktopInfo,
    hasInboxDesktopFeature,
    invokeInboxDesktopIPC,
} from '@proton/shared/lib/desktop/ipcHelpers';
import clsx from '@proton/utils/clsx';

import TopBanner from '../../topBanners/TopBanner';
import { useElectronDefaultApp } from './useElectronDefaultApp';

interface Props {
    className?: string;
}

export const InboxDesktopDefaultAppTopBanner = ({ className }: Props) => {
    const { enabled, isDefault, shouldCheck, triggerPrompt, Prompt } = useElectronDefaultApp();
    const [showBanner, setShowBanner] = useState(false);
    const [dismissOption, setDismissOption] = useState<'dismiss' | 'remind'>('remind');
    const {
        anchorRef,
        isOpen: confirmOpen,
        open: openConfirm,
        close: closeConfirm,
    } = usePopperAnchor<HTMLDivElement>();
    const permaDismissAvailable = hasInboxDesktopFeature('MailtoBannerPermanentDismiss');

    const onClose = () => {
        if (permaDismissAvailable) {
            openConfirm();
            return;
        }

        void invokeInboxDesktopIPC({ type: 'setDefaultMailtoBannerDismissed', payload: true });
        setShowBanner(false);
    };

    const handleConfirm = () => {
        if (dismissOption === 'remind') {
            void invokeInboxDesktopIPC({ type: 'setDefaultMailtoBannerDismissed', payload: true });
        } else if (dismissOption === 'dismiss') {
            void invokeInboxDesktopIPC({ type: 'setDefaultMailtoBannerDismissedPermanently' });
        }

        closeConfirm();
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
        <div ref={anchorRef}>
            <TopBanner className={clsx('bg-info', className)} onClose={onClose}>
                {c('Info').t`Make ${MAIL_APP_NAME} your default email application.`}{' '}
                <InlineLinkButton onClick={triggerPrompt}>{c('Action').t`Set as default`}</InlineLinkButton>
            </TopBanner>

            {Prompt}

            {permaDismissAvailable && (
                <Dropdown
                    anchorRef={anchorRef}
                    isOpen={confirmOpen}
                    onClose={closeConfirm}
                    originalPlacement="bottom-end"
                    contentProps={{ className: 'p-0' }}
                    style={{ marginLeft: '-8px' }}
                    noCaret
                    autoClose={false}
                >
                    <div className="flex flex-col items-start p-4 gap-1">
                        <p className="font-semibold m-0 mb-2" style={{ color: 'var(--text-weak)', fontWeight: 600 }}>
                            {c('Title').t`Keep this banner hidden?`}
                        </p>
                        <RadioGroup
                            name="banner-dismiss-option"
                            value={dismissOption}
                            onChange={setDismissOption}
                            options={[
                                { value: 'dismiss', label: c('Option').t`Yes, don't show again` },
                                { value: 'remind', label: c('Option').t`Remind me later` },
                            ]}
                        />

                        <Button fullWidth shape="outline" onClick={handleConfirm}>
                            {c('Action').t`Confirm`}
                        </Button>
                    </div>
                </Dropdown>
            )}
        </div>
    );
};
export default InboxDesktopDefaultAppTopBanner;
