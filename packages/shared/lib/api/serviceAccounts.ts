import { getEmailParts } from '../helpers/email';
import type { ServiceAccountAccessInput, ServiceAccountInput } from '../interfaces/ServiceAccount';

const BASE_URL = 'account/v1/service-accounts';

export const queryServiceAccounts = () => ({ method: 'get', url: BASE_URL });

export const createServiceAccount = ({ Name, Email }: ServiceAccountInput) => {
    const [Local, Domain] = getEmailParts(Email.trim());
    return { method: 'post', url: BASE_URL, data: { Name, Email: Email.trim(), Local, Domain } };
};

export const deleteServiceAccount = (memberID: string) => ({ method: 'delete', url: `${BASE_URL}/${memberID}` });

export const createServiceAccountAccess = (memberID: string, data: ServiceAccountAccessInput) => ({
    method: 'post',
    url: `${BASE_URL}/${memberID}/access`,
    data,
});

export const deleteServiceAccountAccess = (memberID: string, delegatedAccessID: string) => ({
    method: 'delete',
    url: `${BASE_URL}/${memberID}/access/${delegatedAccessID}`,
});
