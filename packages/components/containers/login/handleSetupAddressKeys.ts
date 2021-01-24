import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { handleSetupKeys } from 'proton-shared/lib/keys';
import handleSetupAddress from '../signup/helpers/handleSetupAddress';

interface Args {
    password: string;
    api: Api;
    username: string;
}

const handleSetupAddressKeys = async ({ username, password, api }: Args) => {
    const [availableAddresses, availableDomains] = await Promise.all([
        api<{ Addresses: Address[] }>(queryAddresses()).then(({ Addresses }) => Addresses),
        api<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains),
    ]);

    const addressesToUse =
        availableAddresses?.length > 0
            ? availableAddresses
            : await handleSetupAddress({ api, domains: availableDomains, username });

    return handleSetupKeys({ api, addresses: addressesToUse, password });
};

export default handleSetupAddressKeys;
