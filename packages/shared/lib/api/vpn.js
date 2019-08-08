export const getClientVPNInfo = () => ({
    method: 'get',
    url: 'vpn'
});

export const queryVPNLogicalServerLoads = () => ({
    method: 'get',
    url: 'vpn/loads'
});

export const queryVPNLogicalServerInfo = () => ({
    method: 'get',
    url: 'vpn/logicals'
});

export const queryVPNServerInfo = () => ({
    method: 'get',
    url: 'vpn/servers'
});

export const getLocation = () => ({
    method: 'get',
    url: 'vpn/location'
});

export const getVPNServerConfig = ({ LogicalID, ServerID, Country, Category, Tier, Platform, Protocol }) => ({
    method: 'get',
    url: 'vpn/config',
    output: 'arrayBuffer',
    params: { LogicalID, ServerID, Country, Category, Tier, Platform, Protocol }
});

export const getAuthServerVPNInfo = ({ Username, ServerIP, Secret }) => ({
    method: 'post',
    url: 'vpn/auth',
    data: { Username, ServerIP, Secret }
});

export const getAccountingServerVPNInfo = ({ Username, ServerIP, Secret }) => ({
    method: 'post',
    url: 'vpn/accounting',
    data: { Username, ServerIP, Secret }
});

export const updateServerLoad = (encryptedID, { Secret, Bytes }) => ({
    method: 'post',
    url: `vpn/servers/${encryptedID}/load`,
    data: { Secret, Bytes }
});

export const updateServerStatus = (encryptedID, { Secret, Status, Services }) => ({
    method: 'post',
    url: `vpn/servers/${encryptedID}/status`,
    data: { Secret, Status, Services }
});

export const getVPNActiveSessionCount = () => ({
    method: 'get',
    url: 'vpn/sessioncount'
});

export const queryVPNActiveSessionInfo = () => ({
    method: 'get',
    url: 'vpn/sessions'
});
