import type { EnhancedMember, GroupMember, PartialMemberAddress, Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import getRandomString, { DEFAULT_LOWERCASE_CHARSET } from '@proton/utils/getRandomString';
import isTruthy from '@proton/utils/isTruthy';

/**
 * Maximum length the API allows for the local part of an email address (the
 * bit before "@"). Mirrors `UserName::USER_NAME_LENGTH_LIMIT` on the server —
 * if we send anything longer, the backend rejects it with "Email address too
 * long".
 */
export const ADDRESS_LOCAL_PART_MAX_LENGTH = 40;

/**
 * Builds the local part of a group's auto-generated email address.
 *
 * Two callsites in EditGroupModal.tsx:
 *   1. Mail B2B (email field is visible and editable): only `groupName` is
 *      passed. The group-name input has `maxLength={30}` so the result is
 *      always well under 40 today, but the final length cap below is kept as
 *      a defensive guard in case that input cap ever changes.
 *   2. Non-Mail B2B / `hideMail` path (VPN, Pass, Drive — email field is
 *      hidden): we glue `organizationName + groupName + 4-char random suffix`
 *      together. The suffix prevents collisions on the shared
 *      `groups.proton.me` domain, so it must always survive. We slice from the
 *      end (`slice(-40)`) to keep the suffix intact and chop the org-name
 *      prefix instead.
 *
 * The final `.slice(-ADDRESS_LOCAL_PART_MAX_LENGTH).replace(/^-+/, '')` is
 * applied unconditionally so the function's output is guaranteed to satisfy
 * the backend's local-part length limit, regardless of which callsite is used
 * or which input caps are in place upstream.
 */
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
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(-ADDRESS_LOCAL_PART_MAX_LENGTH)
        .replace(/^-+/, '');
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
