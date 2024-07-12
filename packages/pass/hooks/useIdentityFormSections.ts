import { type ComponentType, useEffect, useState } from 'react';

import type { FactoryOpts } from 'imask/masked/factory';
import { c } from 'ttag';

import type { IdentityItemFormValues } from '@proton/pass/lib/validation/identity';

type ActionField =
    | 'addPersonalDetails'
    | 'addAddressDetails'
    | 'addContactDetails'
    | 'addWorkDetails'
    | 'addCustomField';

type FieldName = Exclude<keyof IdentityItemFormValues, 'shareId'>;

type IdentityField = {
    name: FieldName;
    label: string;
    placeholder: string;
    component?: ComponentType<any>;
    mask?: FactoryOpts;
    onClick?: ActionField;
};

type FieldSection = {
    name: string;
    expanded: boolean;
    fields: IdentityField[];
    addButton?: {
        label: string;
        onClick: ActionField;
        fields: IdentityField[];
    };
};

export const getInitialState = (shareId: string): IdentityItemFormValues => ({
    shareId,
    fullName: '',
    email: '',
    phoneNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    birthdate: '',
    gender: '',
    organization: '',
    streetAddress: '',
    zipOrPostalCode: '',
    city: '',
    stateOrProvince: '',
    countryOrRegion: '',
    floor: '',
    county: '',
    socialSecurityNumber: '',
    passportNumber: '',
    licenseNumber: '',
    website: '',
    xHandle: '',
    linkedin: '',
    reddit: '',
    facebook: '',
    yahoo: '',
    instagram: '',
    secondPhoneNumber: '',
    company: '',
    jobTitle: '',
    personalWebsite: '',
    workPhoneNumber: '',
    workEmail: '',
    extraAddressDetails: [],
    extraSections: [],
    extraContactDetails: [],
    extraWorkDetails: [],
    extraPersonalDetails: [],
    name: '',
    note: '',
});

const getFormSections = (): FieldSection[] => [
    {
        name: c('Label').t`Personal details`,
        expanded: true,
        fields: [
            {
                name: 'fullName',
                label: c('Label').t`Full Name`,
                placeholder: c('Label').t`Full Name`,
            },
            {
                name: 'email',
                label: c('Label').t`Email`,
                placeholder: c('Label').t`Email`,
            },
            {
                name: 'phoneNumber',
                label: c('Label').t`Phone number`,
                placeholder: c('Label').t`Phone number`,
            },
        ],
        addButton: {
            label: c('Action').t`Add more`,
            onClick: 'addPersonalDetails',
            fields: [
                {
                    name: 'firstName',
                    label: c('Label').t`First name`,
                    placeholder: c('Label').t`First name`,
                },
                {
                    name: 'middleName',
                    label: c('Label').t`Middle name`,
                    placeholder: c('Label').t`Middle name`,
                },
                {
                    name: 'lastName',
                    label: c('Label').t`Last name`,
                    placeholder: c('Label').t`Last name`,
                },
                {
                    name: 'birthdate',
                    label: c('Label').t`Birthdate`,
                    placeholder: c('Label').t`Birthdate`,
                },
                {
                    name: 'gender',
                    label: c('Label').t`Gender`,
                    placeholder: c('Label').t`Gender`,
                },
                {
                    name: 'extraPersonalDetails',
                    label: c('Label').t`Custom field`,
                    placeholder: c('Label').t`Custom field`,
                    onClick: 'addCustomField',
                },
            ],
        },
    },
    {
        name: c('Label').t`Address details`,
        expanded: true,
        fields: [
            {
                name: 'organization',
                label: c('Label').t`Organization`,
                placeholder: c('Label').t`Name`,
            },
            {
                name: 'streetAddress',
                label: c('Label').t`Street address, P.O. box`,
                placeholder: c('Label').t`Street address`,
            },
            {
                name: 'floor',
                label: c('Label').t`Floor, apartment, building`,
                placeholder: c('Label').t`Additional details`,
            },
            {
                name: 'zipOrPostalCode',
                label: c('Label').t`ZIP or Postal code`,
                placeholder: c('Label').t`ZIP or Postal code`,
            },
            {
                name: 'city',
                label: c('Label').t`City`,
                placeholder: c('Label').t`City`,
            },
            {
                name: 'stateOrProvince',
                label: c('Label').t`State or province`,
                placeholder: c('Label').t`State or province`,
            },
            {
                name: 'countryOrRegion',
                label: c('Label').t`Country or Region`,
                placeholder: c('Label').t`Country or Region`,
            },
        ],
    },
    {
        name: c('Label').t`Contact details`,
        expanded: false,
        fields: [
            {
                name: 'socialSecurityNumber',
                label: c('Label').t`Social security number`,
                placeholder: c('Label').t`Social security number`,
            },
            {
                name: 'passportNumber',
                label: c('Label').t`Passport number`,
                placeholder: c('Label').t`Passport number`,
            },
            {
                name: 'licenseNumber',
                label: c('Label').t`License number`,
                placeholder: c('Label').t`License number`,
            },
            {
                name: 'website',
                label: c('Label').t`Website`,
                placeholder: c('Label').t`https://example.com`,
            },
            {
                name: 'xHandle',
                label: c('Label').t`X handle`,
                placeholder: c('Label').t`@username`,
            },
            {
                name: 'secondPhoneNumber',
                label: c('Label').t`Phone number`,
                placeholder: c('Label').t`Phone number`,
            },
        ],
    },
    {
        name: c('Label').t`Work details`,
        expanded: false,
        fields: [
            {
                name: 'company',
                label: c('Label').t`Company`,
                placeholder: c('Label').t`Company`,
            },
            {
                name: 'jobTitle',
                label: c('Label').t`Job title`,
                placeholder: c('Label').t`Job title`,
            },
        ],
        addButton: {
            label: c('Action').t`Add more`,
            onClick: 'addWorkDetails',
            fields: [
                {
                    name: 'personalWebsite',
                    label: c('Label').t`Personal website`,
                    placeholder: c('Label').t`Personal website`,
                },
                {
                    name: 'workPhoneNumber',
                    label: c('Label').t`Work phone number`,
                    placeholder: c('Label').t`Work phone number`,
                },
                {
                    name: 'workEmail',
                    label: c('Label').t`Work email`,
                    placeholder: c('Label').t`Work email`,
                },
                {
                    name: 'extraWorkDetails',
                    label: c('Label').t`Custom field`,
                    placeholder: c('Label').t`Custom field`,
                },
            ],
        },
    },
];

export const useIdentityFormSections = () => {
    const [sections, setSections] = useState<FieldSection[]>([]);

    const updateSectionFields = (sectionName: string, newField: IdentityField) => {
        setSections((prevSections) =>
            prevSections.map((section: FieldSection) => {
                if (section.name !== sectionName) return section;

                // Add the new field to main the fields array
                const newState: FieldSection = { ...section, fields: [...section.fields, newField] };

                // Remove the field from the "extras" dropdown
                if (newState.addButton) {
                    newState.addButton = {
                        ...newState.addButton,
                        fields: newState.addButton.fields.filter(({ name }) => name !== newField.name),
                    };
                }

                return newState;
            })
        );
    };

    const addPersonalDetails = (fieldName: string, label: string) => {
        updateSectionFields('Personal details', {
            name: fieldName as FieldName,
            label,
            placeholder: label,
        });
    };

    const addWorkDetails = (fieldName: string, label: string) => {
        updateSectionFields('Work details', {
            name: fieldName as FieldName,
            label,
            placeholder: label,
        });
    };

    const actions: Partial<Record<ActionField, (...args: string[]) => void>> = {
        addPersonalDetails,
        addWorkDetails,
    };

    useEffect(() => setSections(getFormSections()), []);

    return { sections, actions };
};
