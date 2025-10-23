import type { EnhancedMember, GroupMember, PartialMemberAddress, Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import getRandomString, { DEFAULT_LOWERCASE_CHARSET } from '@proton/utils/getRandomString';
import isTruthy from '@proton/utils/isTruthy';

export const getAddressSuggestedLocalPart = (
    groupName: string,
    organizationName: string | undefined = undefined,
    generateSuffix: boolean = false
) => {
    const randomSuffix = generateSuffix ? getRandomString(4, DEFAULT_LOWERCASE_CHARSET) : '';
    return [organizationName, groupName, randomSuffix]
        .filter(isTruthy)
        .join(' ')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_\.\s+]/g, '')
        .replace(/\s+/g, '-');
};

export const convertEnhancedMembersToContactEmails = (members?: EnhancedMember[]): ContactEmail[] => {
    if (!members) {
        return [];
    }
    const createContactEmail = (member: EnhancedMember) => (address: PartialMemberAddress) => ({
        ID: address.ID,
        Email: address.Email,
        Name: member.Name,
        Type: [],
        Defaults: 0,
        Order: 0,
        ContactID: member.ID,
        LabelIDs: [],
        LastUsedTime: 0,
    });
    return members.flatMap((member) => member.Addresses?.map(createContactEmail(member)) || []);
};

export const convertGroupMemberToRecipient = (groupMembers: (GroupMember | ContactEmail)[]): Recipient[] =>
    groupMembers.map((member) => ({
        Name: member.Email || '',
        Address: member.Email || '',
    }));
