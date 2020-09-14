import { PaginationParams } from './interface';

export const queryAddresses = (params?: PaginationParams) => ({
    url: 'addresses',
    method: 'get',
    params,
});

interface CreateAddressArgs {
    MemberID?: string;
    Local: string;
    Domain: string;
    DisplayName?: string;
    Signature?: string;
}
export const createAddress = ({ MemberID, Local, Domain, DisplayName, Signature }: CreateAddressArgs) => ({
    url: 'addresses',
    method: 'post',
    data: { MemberID, Local, Domain, DisplayName, Signature },
});

export const orderAddress = (AddressIDs: string[]) => ({
    url: 'addresses/order',
    method: 'put',
    data: { AddressIDs },
});

interface SetupAddressArgs {
    Domain: string;
    DisplayName: string;
    Signature?: string;
}
export const setupAddress = ({ Domain, DisplayName, Signature }: SetupAddressArgs) => ({
    url: 'addresses/setup',
    method: 'post',
    data: { Domain, DisplayName, Signature },
});

export const getAddress = (addressID: string) => ({
    url: `addresses/${addressID}`,
    method: 'get',
});

export const getCanonicalAddresses = (Emails: string[]) => ({
    // params doesn't work correctly so
    url: `addresses/canonical?${Emails.map((email) => `Emails[]=${email}`).join('&')}`,
    method: 'get',
    // params: { Emails },
});

export const updateAddress = (
    addressID: string,
    { DisplayName, Signature }: { DisplayName?: string; Signature?: string }
) => ({
    url: `addresses/${addressID}`,
    method: 'put',
    data: { DisplayName, Signature },
});

export const enableAddress = (addressID: string) => ({
    url: `addresses/${addressID}/enable`,
    method: 'put',
});

export const disableAddress = (addressID: string) => ({
    url: `addresses/${addressID}/disable`,
    method: 'put',
});

export const deleteAddress = (addressID: string) => ({
    url: `addresses/${addressID}`,
    method: 'delete',
});
