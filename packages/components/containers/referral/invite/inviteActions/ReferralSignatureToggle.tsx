import { c } from 'ttag';
import { useCallback, useEffect, useState } from 'react';
import { Toggle, useMailSettings, useApi, Info } from '@proton/components';
import { updatePMSignatureReferralLink } from '@proton/shared/lib/api/mailSettings';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { useIsMounted, useLoading } from '../../../../hooks';

const ReferralSignatureToggle = () => {
    const [showShareLinkFooter, setShowShareLinkFooter] = useState(0);
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const api = useApi();
    const [loading, loadingCallback] = useLoading();
    const isMounted = useIsMounted();
    const mailAppName = getAppName(APPS.PROTONMAIL);

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

    if (loadingMailSettings || !mailSettings?.PMSignature) {
        return null;
    }

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
                title={c('Tooltip')
                    .t`For easy sharing with all your contacts, the link text “Try ${mailAppName} Plus Free for one month” is added to the bottom of your emails`}
            />
        </div>
    );
};

export default ReferralSignatureToggle;
