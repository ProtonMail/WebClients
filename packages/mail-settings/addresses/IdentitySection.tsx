import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Loader } from '@proton/atoms/Loader/Loader';
import Option from '@proton/components/components/option/Option';
import { SettingsCardRows } from '@proton/components/containers/account/SettingsCardRows';
import { SettingsCardSection } from '@proton/components/containers/account/SettingsCardSection';
import { SettingsSelectRow } from '@proton/components/containers/account/SettingsSelectRow';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import EditAddressesSection from './EditAddressesSection';
import { PMSignatureSection, usePMSignatureSectionVisible } from './PMSignatureSection';

const IdentitySection = () => {
    const [addresses, loading] = useAddresses();
    const showPMSignatureSection = usePMSignatureSectionVisible();

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

    const title = c('Title').t`Display name and signature`;

    if (!loading && !filteredAddresses.length) {
        return <SettingsCardSection title={title} description={c('Info').t`No addresses exist`} />;
    }

    return (
        <SettingsCardSection title={title}>
            {loading || !Array.isArray(addresses) ? (
                <Loader />
            ) : (
                <SettingsCardRows>
                    <SettingsSelectRow
                        id="addressSelector"
                        label={<SettingsSelectRow.Label>{c('Label').t`Email address`}</SettingsSelectRow.Label>}
                        select={
                            <SettingsSelectRow.Select<Address>
                                onValue={(address) => {
                                    setAddressID(address.ID);
                                }}
                                value={selectedAddress}
                                data-testid="settings:identity-section:address"
                            >
                                {filteredAddresses.map((address) => (
                                    <Option key={address.ID} value={address} title={address.Email} />
                                ))}
                            </SettingsSelectRow.Select>
                        }
                    />
                    {selectedAddress && <EditAddressesSection address={selectedAddress} />}
                    {showPMSignatureSection && <PMSignatureSection />}
                </SettingsCardRows>
            )}
        </SettingsCardSection>
    );
};

export default IdentitySection;
