import { useMemo } from 'react';

import { c } from 'ttag';

import { canonicalizeInternalEmail, getEmailParts, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { contactToInput } from '@proton/shared/lib/mail/recipient';

import ContactEmailInputAutocomplete, {
    type ContactEmailInputAutocompleteProps,
} from './ContactEmailInputAutocomplete';

export const emailIncludesDomain = (domains: Set<string>, address: string) => {
    const [, domain] = getEmailParts(address);

    return domains.has(domain);
};

export interface ContactEmailInputProps extends Omit<ContactEmailInputAutocompleteProps, 'options' | 'onValue'> {
    contactEmails: ContactEmail[] | undefined;
    protonDomains: Set<string>;
    addresses: Address[] | undefined;
    onValue: (value: string, error: string) => void;
    ignoreEmails: Set<string>;
}

const ContactEmailInput = ({
    value,
    onValue,
    ignoreEmails,
    addresses,
    protonDomains,
    contactEmails,
    ...rest
}: ContactEmailInputProps) => {
    const ownNormalizedEmails = useMemo(
        () => (addresses ?? []).map(({ Email }) => canonicalizeInternalEmail(Email)),
        [addresses]
    );

    const options = useMemo(() => {
        return (contactEmails || [])
            .filter((value) => emailIncludesDomain(protonDomains, value.Email) && !ignoreEmails.has(value.Email))
            .map((value) => ({
                label: contactToInput(value),
                value: value.Email,
            }));
    }, [protonDomains, contactEmails]);

    const getError = (value: string) => {
        if (ownNormalizedEmails.includes(canonicalizeInternalEmail(value))) {
            return c('Error').t`Address cannot be yours`;
        }
        if (!validateEmailAddress(value)) {
            return c('Error').t`Invalid email address`;
        }
        return '';
    };

    return (
        <ContactEmailInputAutocomplete
            options={options}
            value={value}
            onValue={(value) => {
                onValue(value, getError(value));
            }}
            {...rest}
        />
    );
};

export default ContactEmailInput;
