import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { Address } from '@proton/shared/lib/interfaces';

import { Info, Loader, Option, SelectTwo } from '../../components';
import { useAddresses, useMailSettings, useUserSettings } from '../../hooks';
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

    const [addressID, setAddressID] = useState<string>();

    const filteredAddresses = useMemo<Address[]>(() => {
        return addresses?.filter(getIsAddressActive) || [];
    }, [addresses]);

    const selectedAddress = filteredAddresses.find((address) => address.ID === addressID) || filteredAddresses[0];

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
                            <label className="on-mobile-pb0 text-semibold" htmlFor="addressSelector">
                                {c('Label').t`Email address`}
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="on-mobile-pb0 flex flex-row flex-nowrap">
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
                        <SettingsLayoutLeft>
                            <label
                                htmlFor="pmSignatureToggle"
                                className="text-semibold"
                                data-testid="settings:identity-section:signature-toggle-label"
                            >
                                <span className="mr-2">{c('Label').t`${MAIL_APP_NAME} footer`}</span>
                                <Info title={c('Info').t`Let your contacts know you care about their privacy.`} />
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight>
                            <PMSignature
                                id="pmSignatureToggle"
                                mailSettings={mailSettings}
                                userSettings={userSettings}
                            />
                        </SettingsLayoutRight>
                    </SettingsLayout>
                </>
            )}
        </SettingsSectionWide>
    );
};

export default IdentitySection;
