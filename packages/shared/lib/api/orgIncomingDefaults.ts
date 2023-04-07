export const getOrgIncomingDefaults = ({
    Location,
    Page,
    PageSize,
    Keyword,
}: {
    Location?: number;
    Page?: number;
    PageSize?: number;
    Keyword?: string;
} = {}) => ({
    method: 'get',
    url: 'mail/v4/orgincomingdefaults',
    params: { Location, Page, PageSize, Keyword },
});

interface OrgIncomingDefaultConfig {
    Email?: string;
    Domain?: string;
    Location: number;
}

interface AddOrgIncomingDefaultConfig extends OrgIncomingDefaultConfig {
    /**
     * If email is already registered in orgIncomingDefaults we overwrite the location
     * Avoids to find the already exiting item ID
     */
    Overwrite?: boolean;
}

export const addOrgIncomingDefault = ({ Email, Domain, Location, Overwrite }: AddOrgIncomingDefaultConfig) => {
    let url = 'mail/v4/orgincomingdefaults';

    if (Overwrite) {
        url = `${url}?Overwrite=1`;
    }

    return {
        method: 'post',
        url,
        data: { Email, Domain, Location },
    };
};

export const updateOrgIncomingDefault = (
    orgIncomingDefaultID: string,
    { Email, Domain, Location }: OrgIncomingDefaultConfig
) => ({
    method: 'put',
    url: `mail/v4/orgincomingdefaults/${orgIncomingDefaultID}`,
    data: { Email, Domain, Location },
});

export const deleteOrgIncomingDefaults = (IDs: string[]) => ({
    method: 'put',
    url: 'mail/v4/orgincomingdefaults/delete',
    data: { IDs },
});

export const clearOrgIncomingDefaults = () => ({
    method: 'delete',
    url: 'mail/v4/orgincomingdefaults',
});
