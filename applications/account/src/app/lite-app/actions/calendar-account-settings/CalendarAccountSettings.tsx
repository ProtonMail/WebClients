import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUpdateAccountRecovery } from '@proton/account/recovery/useUpdateAccountRecovery';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Href } from '@proton/atoms/Href/Href';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import CrashReportsToggle from '@proton/components/containers/privacy/CrashReportsToggle';
import TelemetryToggle from '@proton/components/containers/privacy/TelemetryToggle';
import RecoveryEmail from '@proton/components/containers/recovery/email/RecoveryEmail';
import RecoveryPhone from '@proton/components/containers/recovery/phone/RecoveryPhone';
import { useQrCodeSignInToggle } from '@proton/components/containers/recovery/useQrCodeSignInToggle';
import useMyCountry from '@proton/components/hooks/useMyCountry';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import { useDefaultAddress } from '../../components/Address/useDefaultAddress';
import LiteSettingsPage from '../../components/settings/LiteSettingsPage';
import LiteSettingsRow from '../../components/settings/LiteSettingsRow';
import LiteSettingsSection from '../../components/settings/LiteSettingsSection';

interface Props {
    layout: (children: ReactNode, props?: any) => ReactNode;
    loader: ReactNode;
}

/** The settings of `AccountSettings` (ET), in the NGC lite settings style, for the NGC mobile apps */
const CalendarAccountSettings = ({ layout, loader }: Props) => {
    const [addresses, loadingAddresses] = useAddresses();
    const [, loadingUserSettings] = useUserSettings();
    const defaultCountry = useMyCountry();
    const accountRecovery = useUpdateAccountRecovery();
    const qrCodeSignInToggle = useQrCodeSignInToggle();
    const { defaultAddress, options, saving, setDefaultAddress } = useDefaultAddress();

    if (loadingAddresses || loadingUserSettings || accountRecovery.data.loading) {
        return loader;
    }

    return layout(
        <LiteSettingsPage>
            {accountRecovery.el}

            {!getIsBYOEOnlyAccount(addresses) && (
                <LiteSettingsSection title={c('Title').t`Email address`}>
                    <LiteSettingsRow htmlFor="addressSelector" label={c('Label').t`Default email address`}>
                        <SelectTwo<Address>
                            id="addressSelector"
                            unstyled
                            aria-labelledby="addressSelector-label"
                            size={{ width: DropdownSizeUnit.Dynamic }}
                            value={defaultAddress}
                            loading={saving}
                            disabled={saving}
                            onValue={(address) => setDefaultAddress(address.ID)}
                        >
                            {options.map((address) => (
                                <Option key={address.ID} value={address} title={address.Email} />
                            ))}
                        </SelectTwo>
                    </LiteSettingsRow>
                </LiteSettingsSection>
            )}

            <LiteSettingsSection title={c('Title').t`Privacy`}>
                <LiteSettingsRow htmlFor="crashReports" label={c('Label').t`Send crash reports`}>
                    <CrashReportsToggle id="crashReports" />
                </LiteSettingsRow>
                <LiteSettingsRow htmlFor="telemetry" label={c('Label').t`Collect usage diagnostics`}>
                    <TelemetryToggle id="telemetry" />
                </LiteSettingsRow>
            </LiteSettingsSection>

            <LiteSettingsSection title={c('Title').t`Account recovery`}>
                <LiteSettingsRow
                    htmlFor="edmToggle"
                    label={c('edm').t`Sign in with QR code`}
                    description={
                        <>
                            {c('edm').t`Scan QR code on your mobile device to sign in.`}{' '}
                            <Href href={getKnowledgeBaseUrl('/qr-code-sign-in')}>{c('Link').t`Learn more`}</Href>
                        </>
                    }
                >
                    <Toggle id="edmToggle" {...qrCodeSignInToggle} />
                </LiteSettingsRow>
                <LiteSettingsRow htmlFor="recovery-email-input" label={c('Label').t`Recovery email address`} stacked>
                    <RecoveryEmail {...accountRecovery.recoveryEmail.props} />
                </LiteSettingsRow>
                <LiteSettingsRow htmlFor="passwordEmailResetToggle" label={c('Label').t`Allow recovery by email`}>
                    <Toggle id="passwordEmailResetToggle" {...accountRecovery.recoveryEmail.toggleProps} />
                </LiteSettingsRow>
                <LiteSettingsRow htmlFor="phoneInput" label={c('label').t`Recovery phone number`} stacked>
                    <RecoveryPhone defaultCountry={defaultCountry} {...accountRecovery.recoveryPhone.props} />
                </LiteSettingsRow>
                <LiteSettingsRow htmlFor="passwordPhoneResetToggle" label={c('Label').t`Allow recovery by phone`}>
                    <Toggle id="passwordPhoneResetToggle" {...accountRecovery.recoveryPhone.toggleProps} />
                </LiteSettingsRow>
            </LiteSettingsSection>
        </LiteSettingsPage>,
        { className: 'overflow-auto' }
    );
};

export default CalendarAccountSettings;
