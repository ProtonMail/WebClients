import { ADDRESS_STATUS, ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { CANONICALIZE_SCHEME, canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { PartialMemberAddress } from '@proton/shared/lib/interfaces/Member';

import type { ApiImporterOrganizationUser } from '../api/api.interface';

export const areEquivalentEmails = (...emails: (string | undefined)[]) => {
    const normalizedEmails = emails.map((email) =>
        email ? canonicalizeEmail(email, CANONICALIZE_SCHEME.DEFAULT) : undefined
    );
    return normalizedEmails.every((email, _, array) => email !== undefined && email === array[0]);
};

export const isRelevantAddress = (address?: PartialMemberAddress | Address) =>
    address?.Status === ADDRESS_STATUS.STATUS_ENABLED && address?.Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN;

export const isKnownEmail = (email: string | undefined, knownEmails: (string | undefined)[]) =>
    knownEmails.some((known) => areEquivalentEmails(known, email));

export const shouldCreateUserPredicate =
    (selfEmail: string | undefined, knownEmails: (string | undefined)[]) => (user: { Email: string }) =>
        !areEquivalentEmails(user.Email, selfEmail) && !isKnownEmail(user.Email, knownEmails);

export const isProviderUserSelectable = (u: ApiImporterOrganizationUser) =>
    !u.ImporterOrganizationUser && u.Eligibility.IsEligible;
