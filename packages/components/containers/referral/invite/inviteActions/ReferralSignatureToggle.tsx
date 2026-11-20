import { Fragment } from 'react';

import { c } from 'ttag';

import { useAvailableApps } from '@proton/account/availableApps/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { PM_SIGNATURE_REFERRAL } from '@proton/shared/lib/mail/mailSettings';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';

import Info from '../../../../components/link/Info';
import SkeletonLoader from '../../../../components/skeletonLoader/SkeletonLoader';
import Toggle from '../../../../components/toggle/Toggle';

const ReferralSignatureToggle = () => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const { update, isLoading } = useUpdateMailSetting();

    const availableApps = useAvailableApps();

    if (loadingMailSettings || loadingUserSettings) {
        return <SkeletonLoader width="22rem" height="1.5rem" />;
    }

    if (
        !mailSettings ||
        !mailSettings.PMSignature ||
        !userSettings.Referral?.Link ||
        !availableApps.includes(APPS.PROTONMAIL)
    ) {
        return null;
    }

    const toggleReferralSignature = (checked: boolean) => {
        const nextValue = (() => {
            if (checked) {
                return PM_SIGNATURE_REFERRAL.ENABLED;
            }
            return PM_SIGNATURE_REFERRAL.DISABLED;
        })();
        update('PMSignatureReferralLink', nextValue, { notify: false });
    };

    const signature = (
        <Fragment key="signature">
            <br />
            <br />
            <div
                dangerouslySetInnerHTML={{
                    __html: getProtonMailSignature(true, userSettings.Referral?.Link, mailSettings.PMSignatureContent),
                }}
            />
            <br />
        </Fragment>
    );

    return (
        <div className="flex flex-nowrap items-center">
            <Toggle
                id="toggleSharedFooterLink"
                checked={!!mailSettings.PMSignatureReferralLink}
                onChange={({ target: { checked } }) => toggleReferralSignature(checked)}
                loading={isLoading('PMSignatureReferralLink')}
                className="shrink-0"
            />

            <label htmlFor="toggleSharedFooterLink" className="pl-2">
                <span className="mr-1">{c('Action').t`Add referral link to ${MAIL_APP_NAME} signature`}</span>
            </label>

            <Info
                title={
                    /*
                     * translators: Signature is the default mail siganture : Sent with protonmail secure email.
                     * the word "protonmail" is the "link" we are talking about.
                     */
                    c('Tooltip')
                        .jt`Sets the following footer in the emails you send: ${signature} The link points to your referral link. The footer will appear below your signature. You can personalize your signature anytime in the settings.`
                }
                className="shrink-0"
            />
        </div>
    );
};

export default ReferralSignatureToggle;
