import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import Info from '@proton/components/components/link/Info';
import UpsellIcon from '@proton/components/components/upsell/UpsellIcon';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import clsx from '@proton/utils/clsx';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import PMSignature from './PMSignatureField';

export const PMSignatureSection = () => {
    const [user] = useUser();
    const [mailSettings, loadingMailSettings] = useMailSettings();

    const enabled = hasBit(mailSettings?.PMSignature, PM_SIGNATURE.ENABLED);
    const locked = hasBit(mailSettings?.PMSignature, PM_SIGNATURE.LOCKED);

    if ((!enabled && locked) || loadingMailSettings) {
        return null;
    }

    return (
        <SettingsLayout>
            <SettingsLayoutLeft className={clsx([!user.hasPaidMail && 'settings-layout-left--has-upsell'])}>
                <label
                    htmlFor="pmSignatureToggle"
                    className="text-semibold"
                    data-testid="settings:identity-section:signature-toggle-label"
                >
                    <span className="mr-2">{c('Label').t`${MAIL_APP_NAME} footer`}</span>
                    <Info title={c('Info').t`Let your contacts know you care about their privacy.`} />
                    {!user.hasPaidMail && <UpsellIcon className="ml-1 mt-1" />}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight>
                <PMSignature id="pmSignatureToggle" enabled={enabled} locked={locked} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
