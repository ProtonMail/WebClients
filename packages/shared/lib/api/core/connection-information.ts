export interface ConnectionInformationResult {
    IsVpnConnection: boolean;
    IspProvider: string;
    CountryCode: string;
    Ip: string;
}

export const getConnectionInformation = () => ({
    method: 'get',
    url: 'core/v4/connection-information',
});
