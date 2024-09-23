import { Fragment, useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useApi, useMailSettings, useUserSettings } from '@proton/components';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import { updatePMSignatureReferralLink } from '@proton/shared/lib/api/mailSettings';
import { PM_SIGNATURE_REFERRAL } from '@proton/shared/lib/mail/mailSettings';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';

const ReferralSignatureToggle = () => {
    const [showShareLinkFooter, setShowShareLinkFooter] = useState(0);
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const api = useApi();
    const [loading, loadingCallback] = useLoading();
    const isMounted = useIsMounted();

    const toggleReferralSignature = useCallback((nextValue: 0 | 1) => {
        void loadingCallback(
            api(
                updatePMSignatureReferralLink(
                    nextValue ? PM_SIGNATURE_REFERRAL.ENABLED : PM_SIGNATURE_REFERRAL.DISABLED
                )
            )
        ).then(() => {
            if (isMounted()) {
                setShowShareLinkFooter(nextValue);
            }
        });
    }, []);

    useEffect(() => {
        if (loadingMailSettings === false && mailSettings?.PMSignatureReferralLink !== undefined) {
            setShowShareLinkFooter(mailSettings?.PMSignatureReferralLink);
        }
    }, [loadingMailSettings]);

    if (loadingMailSettings || !mailSettings?.PMSignature || loadingUserSettings || !userSettings.Referral?.Link) {
        return null;
    }

    const signature = (
        <Fragment key={'signature'}>
            <br />
            <br />
            <div
                dangerouslySetInnerHTML={{
                    __html: getProtonMailSignature({
                        isReferralProgramLinkEnabled: true,
                        referralProgramUserLink: userSettings.Referral?.Link,
                    }),
                }}
            />
            <br />
        </Fragment>
    );

    return (
        <div className="flex items-center">
            <Toggle
                id="toggleSharedFooterLink"
                title={c('Button').t`Add link to your email footer`}
                checked={showShareLinkFooter === 1}
                onChange={() => toggleReferralSignature(showShareLinkFooter === 0 ? 1 : 0)}
                loading={loading}
                disabled={loading}
            />

            <label htmlFor="toggleSharedFooterLink" className="pl-4">
                <span className="mr-2">{c('Button').t`Add link to your email footer`}</span>
            </label>

            <Info
                title={
                    /*
                     * translators: Signature is the default mail siganture : Sent with protonmail secure email.
                     * the word "protonmail" is the "link" we are talking about.
                     */
                    c('Tooltip')
                        .jt`Sets the following footer in the emails you send: ${signature} The link points to your referral link. The footer will appear below your signature. You can personalise your signature anytime in the settings.`
                }
            />
        </div>
    );
};

export default ReferralSignatureToggle;
