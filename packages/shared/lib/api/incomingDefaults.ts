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
}) => ({
    method: 'get',
    url: 'mail/v4/incomingdefaults',
    params: { Location, Page, PageSize, Keyword },
});

interface IncomingDefaultConfig {
    Email?: string;
    Domain?: string;
    Location: number;
}

export const addIncomingDefault = ({ Email, Domain, Location }: IncomingDefaultConfig) => ({
    method: 'post',
    url: 'mail/v4/incomingdefaults',
    data: { Email, Domain, Location },
});

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
