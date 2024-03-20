import unary from '@proton/utils/unary';

import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS, ADDRESS_TYPE, MEMBER_TYPE } from '../constants';
import { Address, Domain, Member, Recipient, UserModel } from '../interfaces';
import { ContactEmail } from '../interfaces/contacts';
import { getIsDomainActive } from '../organization/helper';
import { canonicalizeInternalEmail } from './email';

export const getIsAddressEnabled = (address: Address) => {
    return address.Status === ADDRESS_STATUS.STATUS_ENABLED;
};

export const getIsAddressDisabled = (address: Address) => {
    return address.Status === ADDRESS_STATUS.STATUS_DISABLED;
};

export const getIsAddressActive = (address: Address) => {
    return (
        address.Status === ADDRESS_STATUS.STATUS_ENABLED &&
        address.Receive === ADDRESS_RECEIVE.RECEIVE_YES &&
        address.Send === ADDRESS_SEND.SEND_YES
    );
};

export const getActiveAddresses = (addresses: Address[]): Address[] => {
    return addresses.filter(unary(getIsAddressActive));
};

export const hasAddresses = (addresses: Address[] | undefined): boolean => {
    return Array.isArray(addresses) && addresses.length > 0;
};

export const getIsAddressExternal = ({ Type }: Address) => {
    return Type === ADDRESS_TYPE.TYPE_EXTERNAL;
};

export const getHasOnlyExternalAddresses = (addresses: Address[]) => {
    return addresses.length >= 1 && addresses.every((address) => getIsAddressExternal(address));
};

export const contactToRecipient = (contact: Partial<ContactEmail> = {}, groupPath?: string): Partial<Recipient> => ({
    Name: contact.Name,
    Address: contact.Email,
    ContactID: contact.ContactID,
    Group: groupPath,
});

export const findUserAddress = (userEmail?: string, addresses: Address[] = []) => {
    if (!userEmail) {
        return undefined;
    }
    const canonicalUserEmail = canonicalizeInternalEmail(userEmail);
    return addresses.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalUserEmail);
};

export const getSelfSendAddresses = (ownAddresses: Address[]) => {
    // For custom domains, Proton Mail allows to have multiple sub-users with the same email address
    // as long as only one of them is enabled. This poses problems when a sub-user
    // with a disabled address wants to send email to the same address enabled in another sub-user.
    // Because of this case, it's better to consider disabled addresses as non self
    return ownAddresses.filter(({ Receive }) => !!Receive);
};

export const getPrimaryAddress = (addresses: Address[]) => {
    const [address] = getActiveAddresses(addresses);

    if (!address) {
        return undefined;
    }

    return address;
};

export const getAvailableAddressDomains = ({
    member,
    user,
    premiumDomains,
    protonDomains,
    customDomains,
}: {
    user: UserModel;
    member: Member;
    premiumDomains: string[];
    protonDomains: string[];
    customDomains: Domain[] | undefined;
}) => {
    const hasProtonDomains = member.Type === MEMBER_TYPE.PROTON;

    return [
        ...(hasProtonDomains ? protonDomains : []),
        ...(Array.isArray(customDomains)
            ? customDomains.filter(getIsDomainActive).map(({ DomainName }) => DomainName)
            : []),
        ...(hasProtonDomains && user.hasPaidMail && Array.isArray(premiumDomains) ? premiumDomains : []),
    ];
};
