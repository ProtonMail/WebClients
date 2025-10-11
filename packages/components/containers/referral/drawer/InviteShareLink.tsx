import { useCallback } from 'react';

import { c } from 'ttag';

import { useReferrals } from '@proton/account/referrals/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import DrawerAppHeadline from '@proton/components/components/drawer/views/shared/DrawerAppHeadline';
import DrawerAppSection from '@proton/components/components/drawer/views/shared/DrawerAppSection';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import throttle from '@proton/utils/throttle';

const InviteShareLink = () => {
    const [referral, loadingReferral] = useReferrals();

    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const { APP_NAME: currentApp } = useConfig();

    // TODO: referral: Add this to referralInfo redux state. Along with formatting. And use in the other InviteShareLink too
    const referrerLink = userSettings.Referral?.Link || '';

    const referrerLinkTrimmed = referrerLink.replace('https://', '');

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

    if (loadingReferral) {
        return <Loader />;
    }

    if (referral.status.hasReachedRewardLimit) {
        return null;
    }

    return (
        <>
            <DrawerAppHeadline>{c('Title').t`Share your link`}</DrawerAppHeadline>
            <DrawerAppSection>
                <div className="flex justify-space-between flex-nowrap gap-2 flex-row w-full">
                    <div className="flex-auto flex items-center user-select" title={referrerLink}>
                        <span className="text-ellipsis text-lg">{referrerLinkTrimmed}</span>
                    </div>
                    <Button
                        color="norm"
                        shape="ghost"
                        onClick={onCopyButtonClick}
                        title={c('Info').t`Copy your referral link`}
                        disabled={!referrerLink}
                        noDisabledStyles
                        icon
                        className="shrink-0"
                        size="small"
                    >
                        <Icon name="squares" className="shrink-0" alt={c('Info').t`Copy your referral link`} />
                    </Button>
                </div>
            </DrawerAppSection>

            <ButtonLike
                as={SettingsLink}
                target="_blank"
                path="/referral"
                app={currentApp}
                color="norm"
                shape="underline"
                size="small"
                className="text-sm"
            >{c('Referral').t`More sharing options`}</ButtonLike>
        </>
    );
};

export default InviteShareLink;
