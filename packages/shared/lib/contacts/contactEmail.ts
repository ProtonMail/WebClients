import { normalize } from '@proton/shared/lib/helpers/string';

export const getContactDisplayNameEmail = ({
    name,
    email,
    emailDelimiters = ['<', '>'],
}: {
    name?: string;
    email: string;
    emailDelimiters?: string[];
}) => {
    const displayOnlyEmail = !name || normalize(name) === normalize(email);
    const nameEmail = displayOnlyEmail ? email : `${name} ${emailDelimiters[0]}${email}${emailDelimiters[1]}`;

    return {
        nameEmail,
        displayOnlyEmail,
    };
};
