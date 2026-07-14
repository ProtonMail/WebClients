import { CANONICALIZE_SCHEME, canonicalizeEmail } from '@proton/shared/lib/helpers/email';

export const areEquivalentEmails = (...emails: (string | undefined)[]) => {
    const normalizedEmails = emails.map((email) =>
        email ? canonicalizeEmail(email, CANONICALIZE_SCHEME.DEFAULT) : undefined
    );
    return normalizedEmails.every((email, _, array) => email !== undefined && email === array[0]);
};

export const isKnownEmail = (email: string | undefined, knownEmails: (string | undefined)[]) =>
    knownEmails.some((known) => areEquivalentEmails(known, email));

export const shouldCreateUserPredicate =
    (selfEmail: string | undefined, knownEmails: (string | undefined)[]) => (user: { Email: string }) =>
        !areEquivalentEmails(user.Email, selfEmail) && !isKnownEmail(user.Email, knownEmails);
