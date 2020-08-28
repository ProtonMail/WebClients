import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { getResetAddressesKeys } from 'proton-shared/lib/keys/resetKeys';
import handleSetupAddress from '../signup/helpers/handleSetupAddress';
import handleSetupKeys from '../signup/helpers/handleSetupKeys';

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

    const { salt, passphrase } = await generateKeySaltAndPassphrase(password);
    const newAddressesKeys = await getResetAddressesKeys({ addresses: addressesToUse, passphrase });
    await handleSetupKeys({ api, salt, addressKeys: newAddressesKeys, password });

    return passphrase;
};

export default handleSetupAddressKeys;
