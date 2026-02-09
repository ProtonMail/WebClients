import type { DecryptedKey } from '@proton/shared/lib/interfaces';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { PASSWORD_SEPARATOR, decryptMeetingPassword } from './cryptoUtils';
import { getMeetingLink } from './getMeetingLink';

const isPasswordEncrypted = (password: string): boolean => {
    return password.includes('-----BEGIN PGP MESSAGE-----');
};

export const generateMeetingLinkFromMeeting = async (meeting: Meeting, userKeys?: DecryptedKey[]): Promise<string> => {
    if (!meeting.Password) {
        throw new Error('Meeting password is required to generate meeting link');
    }

    let password = meeting.Password;

    if (isPasswordEncrypted(password)) {
        if (!userKeys) {
            throw new Error('User keys are required to decrypt meeting password');
        }
        password = await decryptMeetingPassword(password, userKeys);
    }

    const basePassword = password.split(PASSWORD_SEPARATOR)[0] ?? '';

    if (!basePassword) {
        throw new Error('Invalid meeting password format');
    }

    const relativePath = getMeetingLink(meeting.MeetingLinkName, basePassword);

    return `${window.location.origin}${relativePath}`;
};
