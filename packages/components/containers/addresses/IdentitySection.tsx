import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';

import Loader from '../../components/loader/Loader';
import Option from '../../components/option/Option';
import SelectTwo from '../../components/selectTwo/SelectTwo';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSectionWide from '../account/SettingsSectionWide';
import EditAddressesSection from './EditAddressesSection';
import { PMSignatureSection } from './PMSignatureSection';

const IdentitySection = () => {
    const [addresses, loading] = useAddresses();

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

                    <PMSignatureSection />
                </>
            )}
        </SettingsSectionWide>
    );
};

export default IdentitySection;
