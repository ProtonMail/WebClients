export const queryAddresses = () => ({
    url: 'addresses',
    method: 'get',
});

export const createAddress = ({ MemberID, Local, Domain, DisplayName, Signature }) => ({
    url: 'addresses',
    method: 'post',
    data: { MemberID, Local, Domain, DisplayName, Signature },
});

export const orderAddress = (AddressIDs) => ({
    url: 'addresses/order',
    method: 'put',
    data: { AddressIDs },
});

export const setupAddress = ({ Domain, DisplayName, Signature }) => ({
    url: 'addresses/setup',
    method: 'post',
    data: { Domain, DisplayName, Signature },
});

export const getAddress = (addressID) => ({
    url: `addresses/${addressID}`,
    method: 'get',
});

export const updateAddress = (addressID, { DisplayName, Signature }) => ({
    url: `addresses/${addressID}`,
    method: 'put',
    data: { DisplayName, Signature },
});

export const enableAddress = (addressID) => ({
    url: `addresses/${addressID}/enable`,
    method: 'put',
});

export const disableAddress = (addressID) => ({
    url: `addresses/${addressID}/disable`,
    method: 'put',
});

export const deleteAddress = (addressID) => ({
    url: `addresses/${addressID}`,
    method: 'delete',
});
