import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import Option from '@proton/components/components/option/Option';
import UpsellIcon from '@proton/components/components/upsell/UpsellIcon';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { SelectTwo } from '../../components';
import { useAddresses, useMailSettings, useUser, useUserSettings } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import EditAddressesSection from './EditAddressesSection';
import PMSignature from './PMSignatureField';

const IdentitySection = () => {
    const [addresses, loading] = useAddresses();
    const [mailSettings] = useMailSettings();
    const [userSettings] = useUserSettings();
    const [user] = useUser();

    const [addressID, setAddressID] = useState<string>();

    const filteredAddresses = useMemo<Address[]>(() => {
        return addresses?.filter(getIsAddressActive) || [];
    }, [addresses]);

    const selectedAddress = filteredAddresses.find((address) => address.ID === addressID) || filteredAddresses[0];

    const hasPaidMail = user.hasPaidMail;

    useEffect(() => {
        if (!addressID && filteredAddresses.length) {
            setAddressID(filteredAddresses[0].ID);
        }
    }, [addressID, filteredAddresses]);

    if (!loading && !filteredAddresses.length) {
        return <SettingsParagraph>{c('Info').t`No addresses exist`}</SettingsParagraph>;
    }

    return (
        <SettingsSectionWide>
            {loading || !Array.isArray(addresses) ? (
                <Loader />
            ) : (
                <>
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label className="pb-0 text-semibold" htmlFor="addressSelector">
                                {c('Label').t`Email address`}
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="pb-0 flex flex-row flex-nowrap">
                            <SelectTwo<Address>
                                id="addressSelector"
                                onValue={(address) => {
                                    setAddressID(address.ID);
                                }}
                                value={selectedAddress}
                                data-testid="settings:identity-section:address"
                            >
                                {filteredAddresses.map((address) => (
                                    <Option key={address.ID} value={address} title={address.Email} />
                                ))}
                            </SelectTwo>
                        </SettingsLayoutRight>
                    </SettingsLayout>

                    {selectedAddress && <EditAddressesSection address={selectedAddress} />}

                    <SettingsLayout>
                        <SettingsLayoutLeft className={clsx([!hasPaidMail && 'settings-layout-left--has-upsell'])}>
                            <label
                                htmlFor="pmSignatureToggle"
                                className="text-semibold"
                                data-testid="settings:identity-section:signature-toggle-label"
                            >
                                <span className="mr-2">{c('Label').t`${MAIL_APP_NAME} footer`}</span>
                                <Info title={c('Info').t`Let your contacts know you care about their privacy.`} />
                                {!hasPaidMail && <UpsellIcon className="ml-1 mt-1" />}
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight>
                            <div className={clsx([hasPaidMail && 'pt-0.5'])}>
                                <PMSignature
                                    id="pmSignatureToggle"
                                    mailSettings={mailSettings}
                                    userSettings={userSettings}
                                />
                            </div>
                        </SettingsLayoutRight>
                    </SettingsLayout>
                </>
            )}
        </SettingsSectionWide>
    );
};

export default IdentitySection;
