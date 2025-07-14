import { useCallback } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import useNotifications from '@proton/components/hooks/useNotifications';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';
import throttle from '@proton/utils/throttle';

import ReferralSignatureToggle from './inviteActions/ReferralSignatureToggle';

const InviteShareLink = ({ className }: { className?: string }) => {
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();

    const referrerLink = userSettings.Referral?.Link || '';

    const onCopyButtonClick = useCallback(
        throttle(
            () => {
                textToClipboard(referrerLink);
                createNotification({
                    text: c('Info').t`Referral link copied to your clipboard`,
                });
            },
            1500,
            { leading: true, trailing: false }
        ),
        [referrerLink]
    );

    return (
        <div className={clsx('flex flex-column gap-4', className)}>
            <h2 className="h3 text-bold">{c('Label').t`Share your referral link`}</h2>

            <div className="flex gap-2 flex-column lg:flex-row bg-weak rounded-lg p-1">
                <div className="flex-auto flex items-center p-2 user-select" title={referrerLink}>
                    <span className="text-ellipsis">{referrerLink}</span>
                </div>
                <div className="flex lg:justify-end">
                    <Button
                        color="norm"
                        onClick={onCopyButtonClick}
                        title={c('Info').t`Copy your referral link`}
                        disabled={!referrerLink}
                        noDisabledStyles
                    >
                        <span className="flex flex-nowrap items-center">
                            <Icon name="squares" className="mr-2 shrink-0" /> {c('Button').t`Copy`}
                        </span>
                    </Button>
                </div>
            </div>

            <ReferralSignatureToggle />
        </div>
    );
};

export default InviteShareLink;
