import { c } from 'ttag';
import { useCallback, useEffect, useState } from 'react';
import { Toggle, useMailSettings, useApi, Info, useIsMounted, useLoading, useUserSettings } from '@proton/components';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';
import { updatePMSignatureReferralLink } from '@proton/shared/lib/api/mailSettings';

const ReferralSignatureToggle = () => {
    const [showShareLinkFooter, setShowShareLinkFooter] = useState(0);
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const api = useApi();
    const [loading, loadingCallback] = useLoading();
    const isMounted = useIsMounted();

    const toggleReferralSignature = useCallback((nextValue: 0 | 1) => {
        void loadingCallback(api(updatePMSignatureReferralLink(nextValue ? 1 : 0))).then(() => {
            if (isMounted()) {
                setShowShareLinkFooter(nextValue);
            }
        });
    }, []);

    useEffect(() => {
        if (loadingMailSettings === false && mailSettings?.PMSignatureReferralLink !== undefined) {
            setShowShareLinkFooter(mailSettings.PMSignatureReferralLink);
        }
    }, [loadingMailSettings]);

    if (loadingMailSettings || !mailSettings?.PMSignature || loadingUserSettings || !userSettings.Referral?.Link) {
        return null;
    }

    const Signature = () => (
        <>
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
        </>
    );

    return (
        <div className="flex flex-align-items-center">
            <Toggle
                id="toggleSharedFooterLink"
                title={c('Button').t`Add link to your email footer`}
                checked={showShareLinkFooter === 1}
                onChange={() => toggleReferralSignature(showShareLinkFooter === 0 ? 1 : 0)}
                loading={loading}
                disabled={loading}
            />

            <label htmlFor="toggleSharedFooterLink" className="pl1">
                <span className="mr0-5">{c('Button').t`Add link to your email footer`}</span>
            </label>

            <Info
                title={
                    /*
                     * translators: Signature is the default mail siganture : Sent with protonmail secure email.
                     * the word "protonmail" is the "link" we are talking about.
                     */
                    c('Tooltip')
                        .jt`Sets the following footer in the emails you send: ${Signature()} The link points to your referral link. The footer will appear below your signature. You can personalise your signature anytime in the settings.`
                }
            />
        </div>
    );
};

export default ReferralSignatureToggle;
