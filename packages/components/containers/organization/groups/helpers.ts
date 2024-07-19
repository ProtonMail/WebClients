import { addDomain } from '@proton/shared/lib/api/domains';
import type { Api, Domain } from '@proton/shared/lib/interfaces';

export const addSubdomain = async (api: Api, domainName: string) => {
    const { Domain } = await api<{ Domain: Domain }>(addDomain({ Name: `${domainName}` }));
    return Domain;
};

export const getAddressSuggestedLocalPart = (groupName: string) => {
    return groupName
        .toLowerCase()
        .replace(/[^a-z0-9-_\.\s+]/g, '')
        .replace(/\s+/g, '-');
};
