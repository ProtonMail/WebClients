import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import type { AliasMailbox, UnsafeItemExtraField, UnsafeItemExtraSection } from '@proton/pass/types';

import type { ExtraFieldGroupValues, UrlGroupValues } from './fields';

export type BaseItemValues = { name: string; note: string };

export type NoteFormValues = {
    name: string;
    note: string;
    shareId: string;
};

export type LoginItemFormValues = {
    name: string;
    note: string;
    passkeys: SanitizedPasskey[];
    password: string;
    shareId: string;
    totpUri: string;
    itemEmail: string;
    itemUsername: string;
    withAlias: boolean;
} & AliasFormValues &
    UrlGroupValues &
    ExtraFieldGroupValues;

export type EditLoginItemFormValues = LoginItemFormValues;
export type NewLoginItemFormValues = LoginItemFormValues;

export type AliasFormValues = {
    aliasPrefix: string;
    aliasSuffix?: { signature: string; value: string };
    mailboxes: AliasMailbox[];
};

export type NewAliasFormValues = AliasFormValues & {
    name: string;
    note: string;
    shareId: string;
};

export type EditAliasFormValues = Pick<AliasFormValues, 'mailboxes'> & {
    name: string;
    note: string;
};

export type ItemIdentity = {
    fullName: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    middleName: string;
    lastName: string;
    birthdate: string;
    gender: string;
    extraPersonalDetails: UnsafeItemExtraField[];
    organization: string;
    streetAddress: string;
    zipOrPostalCode: string;
    city: string;
    stateOrProvince: string;
    countryOrRegion: string;
    floor: string;
    county: string;
    extraAddressDetails: UnsafeItemExtraField[];
    socialSecurityNumber: string;
    passportNumber: string;
    licenseNumber: string;
    website: string;
    xHandle: string;
    secondPhoneNumber: string;
    linkedin: string;
    reddit: string;
    facebook: string;
    yahoo: string;
    instagram: string;
    extraContactDetails: UnsafeItemExtraField[];
    company: string;
    jobTitle: string;
    personalWebsite: string;
    workPhoneNumber: string;
    workEmail: string;
    extraWorkDetails: UnsafeItemExtraField[];
    extraSections: UnsafeItemExtraSection[];
};

export type NewIdentityItemFormValues = NoteFormValues & ItemIdentity;
