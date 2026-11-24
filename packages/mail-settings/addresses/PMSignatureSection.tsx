import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import UpsellIcon from '@proton/components/components/upsell/UpsellIcon';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';

import PMSignature from './PMSignatureField';

/**
 * Whether the footer row has anything to show. Check it in the parent, so a card
 * doesn't keep a divider for a row that renders nothing.
 */
export const usePMSignatureSectionVisible = () => {
    const [mailSettings, loadingMailSettings] = useMailSettings();

    const enabled = hasBit(mailSettings?.PMSignature, PM_SIGNATURE.ENABLED);
    const locked = hasBit(mailSettings?.PMSignature, PM_SIGNATURE.LOCKED);

    return !loadingMailSettings && (enabled || !locked);
};

export const PMSignatureSection = () => {
    const [user] = useUser();
    const [mailSettings] = useMailSettings();

    const enabled = hasBit(mailSettings?.PMSignature, PM_SIGNATURE.ENABLED);
    const locked = hasBit(mailSettings?.PMSignature, PM_SIGNATURE.LOCKED);

    return (
        <div className="flex flex-column flex-nowrap gap-3">
            <div className="flex flex-column gap-1">
                <label
                    htmlFor="pmSignatureToggle"
                    className="flex items-center gap-2 text-semibold"
                    data-testid="settings:identity-section:signature-toggle-label"
                >
                    {c('Label').t`${MAIL_APP_NAME} footer`}
                    {!user.hasPaidMail && <UpsellIcon />}
                </label>
                <p className="m-0 text-sm color-weak">
                    {c('Info').t`Let your contacts know you care about their privacy.`}
                </p>
            </div>
            <PMSignature id="pmSignatureToggle" enabled={enabled} locked={locked} />
        </div>
    );
};
