import { API_CODES } from '@proton/shared/lib/constants';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { ContactMetadata } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import { addApiMock } from '@proton/testing/lib/api';

import { clearAll, componentsHookRenderer, notificationManager } from '../tests/render';
import { SaveVCardContactError, useSaveVCardContact } from './useSaveVCardContact';

jest.mock('@proton/shared/lib/contacts/encrypt', () => ({
    prepareVCardContacts: jest.fn().mockResolvedValue([{ Cards: [] }]),
}));

const ADA: VCardContact = { fn: [{ field: 'fn', value: 'Ada Lovelace', uid: createContactPropertyUid() }] };

const SAVED_CONTACT = { ID: 'CONTACT_ID', Name: 'Ada Lovelace' } as ContactMetadata;

const mockCreateResponse = (Response: { Code: number; Contact?: ContactMetadata }) =>
    addApiMock('contacts/v4/contacts', () => ({ Responses: [{ Response }] }));

const renderSaveVCardContact = () => componentsHookRenderer(useSaveVCardContact).result;

describe('useSaveVCardContact', () => {
    afterEach(clearAll);

    // The created contact is the only place its id and its ContactEmails' ids appear: nothing else has
    // read them yet, and the store only catches up on the next event refresh.
    it('returns the contact the server created', async () => {
        mockCreateResponse({ Code: API_CODES.SINGLE_SUCCESS, Contact: SAVED_CONTACT });

        await expect(renderSaveVCardContact().current(undefined, ADA)).resolves.toEqual(SAVED_CONTACT);
    });

    // The address book refuses an address it already holds, and a caller cannot tell that from any other
    // failure without the code — the request itself succeeded.
    it('carries the conflict code, and says so, when the address is already saved', async () => {
        mockCreateResponse({ Code: API_CUSTOM_ERROR_CODES.ALREADY_EXISTS });

        await expect(renderSaveVCardContact().current(undefined, ADA)).rejects.toMatchObject({
            code: API_CUSTOM_ERROR_CODES.ALREADY_EXISTS,
        });
        expect(notificationManager.createNotification).toHaveBeenCalledWith({
            text: 'A contact with this email address already exists',
            type: 'error',
        });
    });

    it('reports any other failure as a generic one', async () => {
        mockCreateResponse({ Code: API_CUSTOM_ERROR_CODES.NOT_ALLOWED });

        await expect(renderSaveVCardContact().current(undefined, ADA)).rejects.toThrow(SaveVCardContactError);
        expect(notificationManager.createNotification).toHaveBeenCalledWith({
            text: 'Contact could not be saved',
            type: 'error',
        });
    });
});
