import type { ADDRESS_PERMISSIONS } from '@proton/shared/lib/constants';

import type { Address, Api, SignedKeyList } from '../interfaces';
import queryPages from './helpers/queryPages';
import type { PaginationParams } from './interface';

export const queryAddresses = (params?: PaginationParams) => ({
    url: 'core/v4/addresses',
    method: 'get',
    params,
});

export const getAllAddresses = (api: Api): Promise<Address[]> => {
    return queryPages((page, pageSize) => {
        return api<{ Addresses: Address[]; Total: number }>(
            queryAddresses({
                Page: page,
                PageSize: pageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ Addresses }) => Addresses);
    });
};

interface CreateAddressArgs {
    MemberID?: string;
    Local: string;
    Domain: string;
    DisplayName?: string;
    Signature?: string;
}

export const createAddress = ({ MemberID, Local, Domain, DisplayName, Signature }: CreateAddressArgs) => ({
    url: 'core/v4/addresses',
    method: 'post',
    data: { MemberID, Local, Domain, DisplayName, Signature },
});

export const updateAddressesOrder = (AddressIDs: string[]) => ({
    url: 'core/v4/addresses/order',
    method: 'put',
    data: { AddressIDs },
});

interface SetupAddressArgs {
    Domain: string;
    DisplayName: string;
    Signature?: string;
}

export const setupAddress = ({ Domain, DisplayName, Signature }: SetupAddressArgs) => ({
    url: 'core/v4/addresses/setup',
    method: 'post',
    data: { Domain, DisplayName, Signature },
});

export const getAddress = (addressID: string) => ({
    url: `core/v4/addresses/${addressID}`,
    method: 'get',
});

export const getCanonicalAddresses = (Emails: string[]) => ({
    // params doesn't work correctly so
    url: `core/v4/addresses/canonical?${Emails.map((email) => `Emails[]=${email}`).join('&')}`,
    method: 'get',
    // params: { Emails },
});

export const updateAddress = (
    addressID: string,
    { DisplayName, Signature }: { DisplayName?: string; Signature?: string }
) => ({
    url: `core/v4/addresses/${addressID}`,
    method: 'put',
    data: { DisplayName, Signature },
});

export const enableAddress = (addressID: string) => ({
    url: `core/v4/addresses/${addressID}/enable`,
    method: 'put',
});

export const disableAddress = (addressID: string) => ({
    url: `core/v4/addresses/${addressID}/disable`,
    method: 'put',
});

export const deleteAddress = (addressID: string) => ({
    url: `core/v4/addresses/${addressID}/delete`,
    method: 'put',
});

interface RenamedAddressKey {
    ID: string;
    PrivateKey: string;
}

interface RenameInternalAddressData {
    Local: string;
    AddressKeys: RenamedAddressKey[];
}

export const renameInternalAddress = (addressID: string, data: RenameInternalAddressData) => ({
    url: `core/v4/addresses/${addressID}/rename/internal`,
    method: 'put',
    data,
});

interface RenameExternalAddressData {
    Local: string;
    Domain: string;
    AddressKeys: RenamedAddressKey[];
}

export const renameExternalAddress = (addressID: string, data: RenameExternalAddressData) => ({
    url: `core/v4/addresses/${addressID}/rename/external`,
    method: 'put',
    data,
});

export const addressType = (addressID: string, data: { Type: number; SignedKeyList: SignedKeyList }) => ({
    url: `core/v4/addresses/${addressID}/type`,
    method: 'put',
    data,
});

export const switchAddressesOrganizationPermissions = ({
    Ids,
    Permissions,
}: {
    Ids: string[];
    Permissions: ADDRESS_PERMISSIONS[];
}) => ({
    url: `core/v4/members/addresses/permissions/organization/switch`,
    method: 'put',
    data: { Ids, Permissions },
});

export const getAllowAddressDeletion = () => ({
    url: `core/v4/addresses/allowAddressDeletion`,
    method: 'get',
});
