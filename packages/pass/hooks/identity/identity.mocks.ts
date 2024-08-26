import type { IdentityFormSection } from './useIdentityForm';
import type { IdentityFormFields } from './utils';

export const MOCK_FIELDS = {
    fullName: { name: 'fullName', label: 'firstName', placeholder: '' },
    firstName: { name: 'firstName', label: 'firstName', placeholder: '' },
    lastName: { name: 'lastName', label: 'lastName', placeholder: '' },
    email: { name: 'email', label: 'email', placeholder: 'Enter email' },
    phoneNumber: { name: 'phoneNumber', label: 'phoneNumber', placeholder: 'Enter phone' },
} as IdentityFormFields;

export const MOCK_SECTIONS: IdentityFormSection[] = [
    {
        name: 'Personal',
        expanded: true,
        fields: [MOCK_FIELDS.fullName, MOCK_FIELDS.firstName, MOCK_FIELDS.lastName],
    },
    {
        name: 'Contact',
        expanded: false,
        customFieldsKey: 'extraContactDetails',
        fields: [MOCK_FIELDS.email],
        optionalFields: [MOCK_FIELDS.phoneNumber],
    },
];
