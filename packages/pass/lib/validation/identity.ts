import type { FormikErrors } from 'formik';

import { validateItemErrors } from '@proton/pass/lib/validation/item';
import type { ExtraField } from '@proton/pass/types';
import type { ExtraIdentitySection } from '@proton/pass/types/protobuf/item-v1';

export type IdentityItemFormValues = {
    shareId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    middleName: string;
    lastName: string;
    birthdate: string;
    gender: string;
    extraPersonalDetails: ExtraField[];
    organization: string;
    streetAddress: string;
    zipOrPostalCode: string;
    city: string;
    stateOrProvince: string;
    countryOrRegion: string;
    floor: string;
    county: string;
    extraAddressDetails: ExtraField[];
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
    extraContactDetails: ExtraField[];
    company: string;
    jobTitle: string;
    personalWebsite: string;
    workPhoneNumber: string;
    workEmail: string;
    extraWorkDetails: ExtraField[];
    extraSections: ExtraIdentitySection[];
    name: string;
    note: string;
};

export const validateIdentityForm = (values: IdentityItemFormValues): FormikErrors<IdentityItemFormValues> => {
    const errors: FormikErrors<IdentityItemFormValues> = validateItemErrors(values);

    return { ...errors };
};
