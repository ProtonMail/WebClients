import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { useLoading } from '@proton/hooks';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';

import MobileEditAddressSection from '../components/MobileEditAddressSection';
import MobileSection from '../components/MobileSection';
import MobileSectionLabel from '../components/MobileSectionLabel';
import MobileSectionRow from '../components/MobileSectionRow';

import './MobileSettings.scss';

const SignatureSettings = ({
    layout,
    loader,
}: {
    layout: (children: ReactNode, props?: any) => ReactNode;
    loader: ReactNode;
}) => {
    const [isSavingAddressUpdates, withAddressUpdates] = useLoading();

    const [addresses = [], loadingAddresses] = useAddresses();

    const [addressID, setAddressID] = useState<string>();

    const filteredAddresses = sortAddresses(addresses?.filter(getIsAddressActive) || []);

    const selectedAddress = filteredAddresses.find((address) => address.ID === addressID) || filteredAddresses[0];
    const loading = loadingAddresses || selectedAddress === undefined;

    useEffect(() => {
        if (!addressID && filteredAddresses.length) {
            setAddressID(filteredAddresses[0].ID);
        }
    }, [addressID, filteredAddresses]);

    if (loading) {
        return loader;
    }

    return layout(
        <>
            <div className="mobile-settings">
                <MobileSection>
                    <MobileSectionRow stackContent>
                        <MobileSectionLabel htmlFor="addressSelector">{c('Label').t`Email address`}</MobileSectionLabel>
                        <SelectTwo<Address>
                            id="addressSelector"
                            onValue={(address) => setAddressID(address.ID)}
                            value={selectedAddress}
                            className="mb-4"
                        >
                            {addresses.map((address) => (
                                <Option
                                    key={address.ID}
                                    value={address}
                                    title={address.Email}
                                    active={selectedAddress === address}
                                />
                            ))}
                        </SelectTwo>

                        <MobileEditAddressSection
                            address={selectedAddress}
                            onAddressUpdate={withAddressUpdates}
                            isSavingAddressUpdates={isSavingAddressUpdates}
                        />
                    </MobileSectionRow>
                </MobileSection>
            </div>
        </>,
        { className: 'overflow-auto' }
    );
};

export default SignatureSettings;
