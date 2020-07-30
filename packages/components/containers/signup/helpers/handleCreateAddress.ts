import { setupAddress } from 'proton-shared/lib/api/addresses';
import { Api, Address as tsAddress } from 'proton-shared/lib/interfaces';

interface Args {
    api: Api;
    username: string;
    domains: string[];
}

const handleCreateAddress = async ({ api, username, domains }: Args) => {
    const [domain = ''] = domains;
    if (!domain) {
        throw new Error('Missing domain');
    }
    const { Address } = await api<{ Address: tsAddress }>(
        setupAddress({
            Domain: domain,
            DisplayName: username,
            Signature: '',
        })
    );
    return [Address];
};

export default handleCreateAddress;
