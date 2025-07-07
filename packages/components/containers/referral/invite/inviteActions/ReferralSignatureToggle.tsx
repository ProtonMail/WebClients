import { Fragment } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updatePMSignature, updatePMSignatureReferralLink } from '@proton/shared/lib/api/mailSettings';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { PM_SIGNATURE_REFERRAL } from '@proton/shared/lib/mail/mailSettings';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';
import useFlag from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

const useAvailableApps = () => {
    const [user] = useUser();

    const [organization] = useOrganization();

    const isLumoAvailable = useFlag('LumoInProductSwitcher');
    const isDocsHomepageAvailable = useFlag('DriveDocsLandingPageEnabled');

    const availableApps = getAvailableApps({
        user,
        context: 'app',
        organization,

        isLumoAvailable,
        isDocsHomepageAvailable,
    });

    return availableApps;
};

const ReferralSignatureToggle = () => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const api = useApi();

    const dispatch = useDispatch();
    const [togglingSignature, withTogglingSignature] = useLoading();

    const availableApps = useAvailableApps();

    if (
        !mailSettings ||
        loadingMailSettings ||
        loadingUserSettings ||
        !userSettings.Referral?.Link ||
        !availableApps.includes(APPS.PROTONMAIL)
    ) {
        return null;
    }

    const toggleReferralSignature = async (checked: boolean) => {
        const nextValue = (() => {
            if (checked) {
                return PM_SIGNATURE_REFERRAL.ENABLED;
            }
            return PM_SIGNATURE_REFERRAL.DISABLED;
        })();
        await api(updatePMSignatureReferralLink(nextValue));
        dispatch(mailSettingsActions.updateMailSettings({ ...mailSettings, PMSignatureReferralLink: nextValue }));
    };

    const enablePMSignature = async () => {
        await api(updatePMSignature(1));
        dispatch(mailSettingsActions.updateMailSettings({ ...mailSettings, PMSignature: 1 }));
    };

    const handleReferralSignatureClick = async (checked: boolean) => {
        await Promise.all([toggleReferralSignature(checked), !mailSettings.PMSignature ? enablePMSignature() : noop]);
    };

    const signature = (
        <Fragment key="signature">
            <br />
            <br />
            <div
                dangerouslySetInnerHTML={{
                    __html: getProtonMailSignature(true, userSettings.Referral?.Link, mailSettings?.PMSignatureContent),
                }}
            />
            <br />
        </Fragment>
    );

    return (
        <div className="flex items-center">
            <Toggle
                id="toggleSharedFooterLink"
                checked={!!mailSettings.PMSignatureReferralLink}
                onChange={({ target: { checked } }) => withTogglingSignature(handleReferralSignatureClick(checked))}
                loading={togglingSignature}
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
            />
        </div>
    );
};

export default ReferralSignatureToggle;
