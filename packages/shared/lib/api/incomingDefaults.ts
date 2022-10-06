export const getIncomingDefaults = ({
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
    url: 'mail/v4/incomingdefaults',
    params: { Location, Page, PageSize, Keyword },
});

interface IncomingDefaultConfig {
    Email?: string;
    Domain?: string;
    Location: number;
}

interface AddIncomingDefaultConfig extends IncomingDefaultConfig {
    /**
     * If email is already registered in incomingDefaults we overwrite the location
     * Avoids to find the already exiting item ID
     */
    Overwrite?: boolean;
}

export const addIncomingDefault = ({ Email, Domain, Location, Overwrite }: AddIncomingDefaultConfig) => {
    let url = 'mail/v4/incomingdefaults';

    if (Overwrite) {
        url = `${url}?Overwrite=1`;
    }

    return {
        method: 'post',
        url,
        data: { Email, Domain, Location },
    };
};

export const updateIncomingDefault = (
    incomingDefaultID: string,
    { Email, Domain, Location }: IncomingDefaultConfig
) => ({
    method: 'put',
    url: `mail/v4/incomingdefaults/${incomingDefaultID}`,
    data: { Email, Domain, Location },
});

export const deleteIncomingDefaults = (IDs: string[]) => ({
    method: 'put',
    url: 'mail/v4/incomingdefaults/delete',
    data: { IDs },
});

export const clearIncomingDefaults = () => ({
    method: 'delete',
    url: 'mail/v4/incomingdefaults',
});
