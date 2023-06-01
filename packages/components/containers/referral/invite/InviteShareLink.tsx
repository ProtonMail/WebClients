import { useCallback } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, TwitterButton, useNotifications } from '@proton/components';
import { useUserSettings } from '@proton/components/hooks';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import throttle from '@proton/utils/throttle';

const InviteShareLink = () => {
    const [userSettings, loadingUserSettings] = useUserSettings();
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

    if (loadingUserSettings) {
        return null;
    }

    return (
        <div>
            <h2 className="h3 text-bold">{c('Label').t`Your referral link`}</h2>
            <div className="invite-section-share-link flex flex-align-items-stretch gap-2">
                <div
                    className="flex-item-fluid flex flex-align-items-center p-2 user-select border rounded"
                    title={referrerLink}
                >
                    <span className="text-ellipsis">{referrerLink}</span>
                </div>
                <div className="flex gap-2 flex-nowrap flex-justify-end">
                    <Button color="norm" onClick={onCopyButtonClick} title={c('Info').t`Copy your referral link`}>
                        <span className="flex flex-nowrap flex-align-items-center">
                            <Icon name="link" className="mr-1 flex-item-noshrink" /> {c('Button').t`Copy`}
                        </span>
                    </Button>
                    <TwitterButton
                        href={encodeURI(
                            'https://twitter.com/intent/tweet?text=' +
                                c('Info')
                                    .t`I’ve been using @ProtonMail and thought you might like it. It’s a secure email service that protects your privacy. Sign up with my referral link to get 1 month of premium features for free: ${referrerLink}`
                        )}
                        target="_blank"
                    >
                        <span className="flex flex-nowrap flex-align-items-center">
                            <Icon name="brand-twitter" className="mr-1 flex-item-noshrink" /> {c('Button').t`Tweet`}
                        </span>
                    </TwitterButton>
                </div>
            </div>
        </div>
    );
};

export default InviteShareLink;
