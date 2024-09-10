import { c } from 'ttag';

import type { ExtractKeysOfType, IdentityValues } from '@proton/pass/types';

import type { IdentityFormField, IdentityFormSection } from './useIdentityForm';

type FieldType = ExtractKeysOfType<IdentityValues, string>;
export type IdentityFormFields = Record<FieldType, IdentityFormField>;

export const getIdentityFields = (): IdentityFormFields => ({
    fullName: {
        name: 'fullName',
        label: c('Label').t`Full Name`,
        placeholder: c('Label').t`Full Name`,
    },
    email: {
        name: 'email',
        label: c('Label').t`Email`,
        placeholder: c('Label').t`Email`,
    },
    phoneNumber: {
        name: 'phoneNumber',
        label: c('Label').t`Phone number`,
        placeholder: c('Label').t`Phone number`,
    },
    firstName: {
        name: 'firstName',
        label: c('Label').t`First name`,
        placeholder: c('Label').t`First name`,
    },
    middleName: {
        name: 'middleName',
        label: c('Label').t`Middle name`,
        placeholder: c('Label').t`Middle name`,
    },
    lastName: {
        name: 'lastName',
        label: c('Label').t`Last name`,
        placeholder: c('Label').t`Last name`,
    },
    birthdate: {
        name: 'birthdate',
        label: c('Label').t`Birthdate`,
        placeholder: c('Label').t`Birthdate`,
    },
    gender: {
        name: 'gender',
        label: c('Label').t`Gender`,
        placeholder: c('Label').t`Gender`,
    },
    organization: {
        name: 'organization',
        label: c('Label').t`Organization`,
        placeholder: c('Label').t`Name`,
    },
    streetAddress: {
        name: 'streetAddress',
        label: c('Label').t`Street address, P.O. box`,
        placeholder: c('Label').t`Street address`,
    },
    floor: {
        name: 'floor',
        label: c('Label').t`Floor, apartment, building`,
        placeholder: c('Label').t`Additional details`,
    },
    zipOrPostalCode: {
        name: 'zipOrPostalCode',
        label: c('Label').t`ZIP or Postal code`,
        placeholder: c('Label').t`ZIP or Postal code`,
    },
    city: {
        name: 'city',
        label: c('Label').t`City`,
        placeholder: c('Label').t`City`,
    },
    stateOrProvince: {
        name: 'stateOrProvince',
        label: c('Label').t`State or province`,
        placeholder: c('Label').t`State or province`,
    },
    countryOrRegion: {
        name: 'countryOrRegion',
        label: c('Label').t`Country or Region`,
        placeholder: c('Label').t`Country or Region`,
    },
    county: {
        name: 'county',
        label: c('Label').t`County`,
        placeholder: c('Label').t`County`,
    },
    socialSecurityNumber: {
        name: 'socialSecurityNumber',
        label: c('Label').t`Social security number`,
        placeholder: c('Label').t`Social security number`,
        hidden: true,
    },
    passportNumber: {
        name: 'passportNumber',
        label: c('Label').t`Passport number`,
        placeholder: c('Label').t`Passport number`,
    },
    licenseNumber: {
        name: 'licenseNumber',
        label: c('Label').t`License number`,
        placeholder: c('Label').t`License number`,
    },
    website: {
        name: 'website',
        label: c('Label').t`Website`,
        placeholder: c('Label').t`https://example.com`,
    },
    xHandle: {
        name: 'xHandle',
        label: c('Label').t`X handle`,
        placeholder: `@username`,
    },
    linkedin: {
        name: 'linkedin',
        label: c('Label').t`LinkedIn account`,
        placeholder: '',
    },
    facebook: {
        name: 'facebook',
        label: c('Label').t`Facebook account`,
        placeholder: '',
    },
    reddit: {
        name: 'reddit',
        label: c('Label').t`Reddit handle`,
        placeholder: '@username',
    },
    yahoo: {
        name: 'yahoo',
        label: c('Label').t`Yahoo account`,
        placeholder: '',
    },
    instagram: {
        name: 'instagram',
        label: c('Label').t`Instagram handle`,
        placeholder: '@username',
    },
    secondPhoneNumber: {
        name: 'secondPhoneNumber',
        label: c('Label').t`Phone number`,
        placeholder: c('Label').t`Phone number`,
    },
    company: {
        name: 'company',
        label: c('Label').t`Company`,
        placeholder: c('Label').t`Company`,
    },
    jobTitle: {
        name: 'jobTitle',
        label: c('Label').t`Job title`,
        placeholder: c('Label').t`Job title`,
    },
    personalWebsite: {
        name: 'personalWebsite',
        label: c('Label').t`Personal website`,
        placeholder: c('Label').t`Personal website`,
    },
    workPhoneNumber: {
        name: 'workPhoneNumber',
        label: c('Label').t`Work phone number`,
        placeholder: c('Label').t`Work phone number`,
    },
    workEmail: {
        name: 'workEmail',
        label: c('Label').t`Work email`,
        placeholder: c('Label').t`Work email`,
    },
});

export const getInitialSections = (fields: IdentityFormFields): IdentityFormSection[] => [
    {
        name: c('Label').t`Personal details`,
        expanded: true,
        fields: [fields.fullName, fields.email, fields.phoneNumber],
        customFieldsKey: 'extraPersonalDetails',
        optionalFields: [fields.firstName, fields.middleName, fields.lastName, fields.birthdate, fields.gender],
    },
    {
        name: c('Label').t`Address details`,
        expanded: true,
        customFieldsKey: 'extraAddressDetails',
        fields: [
            fields.organization,
            fields.streetAddress,
            fields.zipOrPostalCode,
            fields.city,
            fields.stateOrProvince,
            fields.countryOrRegion,
        ],
        optionalFields: [fields.floor, fields.county],
    },
    {
        name: c('Label').t`Contact details`,
        expanded: false,
        customFieldsKey: 'extraContactDetails',
        fields: [
            fields.socialSecurityNumber,
            fields.passportNumber,
            fields.licenseNumber,
            fields.xHandle,
            fields.secondPhoneNumber,
        ],
        optionalFields: [
            fields.website,
            fields.facebook,
            fields.instagram,
            fields.linkedin,
            fields.reddit,
            fields.yahoo,
        ],
    },
    {
        name: c('Label').t`Work details`,
        expanded: false,
        fields: [fields.company, fields.jobTitle],
        customFieldsKey: 'extraWorkDetails',
        optionalFields: [fields.personalWebsite, fields.workPhoneNumber, fields.workEmail],
    },
];
