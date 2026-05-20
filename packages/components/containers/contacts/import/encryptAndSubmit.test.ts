import { API_CODES } from '@proton/shared/lib/constants';
import { prepareVCardContact } from '@proton/shared/lib/contacts/encrypt';
import { prepareForSaving } from '@proton/shared/lib/contacts/surgery';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import { processContactsInBatches } from './encryptAndSubmit';

jest.mock('@proton/shared/lib/contacts/encrypt');
jest.mock('@proton/shared/lib/contacts/surgery');

const mockPrepareVCardContact = prepareVCardContact as jest.MockedFunction<typeof prepareVCardContact>;
const mockPrepareForSaving = prepareForSaving as jest.MockedFunction<typeof prepareForSaving>;

const mockApi = jest.fn();
const keyPair = {
    privateKey: 'private-key' as any,
    publicKey: 'public-key' as any,
};
const mockLabels = 0;
const mockOverwrite = 0;
const mockOnProgress = jest.fn();

describe('encryptAndSubmit', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Fake contact encryption
        mockPrepareForSaving.mockImplementation((contact) => contact);
        mockPrepareVCardContact.mockResolvedValue({
            Cards: [
                { Type: 2, Data: 'encrypted-data' },
                { Type: 3, Data: 'signed-data' },
            ],
        } as any);
    });

    describe('processContactsInBatches', () => {
        it('should process contacts in batches of 10', async () => {
            const contacts: VCardContact[] = Array.from(
                { length: 25 },
                (_, i) =>
                    ({
                        fn: [{ field: 'fn', value: `Contact ${i}` }],
                    }) as VCardContact
            );

            mockApi
                .mockResolvedValueOnce({
                    Responses: Array.from({ length: 10 }, (_, index) => ({
                        Index: index,
                        Response: {
                            Code: API_CODES.SINGLE_SUCCESS,
                            Contact: { ID: `contact-${index}`, ContactEmails: [] },
                        },
                    })),
                })
                .mockResolvedValueOnce({
                    Responses: Array.from({ length: 10 }, (_, index) => ({
                        Index: index,
                        Response: {
                            Code: API_CODES.SINGLE_SUCCESS,
                            Contact: { ID: `contact-${index + 10}`, ContactEmails: [] },
                        },
                    })),
                })
                .mockResolvedValueOnce({
                    Responses: Array.from({ length: 5 }, (_, index) => ({
                        Index: index,
                        Response: {
                            Code: API_CODES.SINGLE_SUCCESS,
                            Contact: { ID: `contact-${index + 20}`, ContactEmails: [] },
                        },
                    })),
                });

            const abortController = new AbortController();

            await processContactsInBatches({
                contacts,
                labels: mockLabels,
                overwrite: mockOverwrite,
                keyPair,
                api: mockApi,
                signal: abortController.signal,
                onProgress: mockOnProgress,
            });

            // With 25 contacts and batch size 10, we should have 3 API submissions
            expect(mockApi).toHaveBeenCalledTimes(3);
        });

        it('should respect abort signal and return empty array', async () => {
            const contacts: VCardContact[] = Array.from(
                { length: 5 },
                (_, i) =>
                    ({
                        fn: [{ field: 'fn', value: `Contact ${i}` }],
                    }) as VCardContact
            );

            const abortController = new AbortController();
            abortController.abort();

            const result = await processContactsInBatches({
                contacts,
                labels: mockLabels,
                overwrite: mockOverwrite,
                keyPair,
                api: mockApi,
                signal: abortController.signal,
                onProgress: mockOnProgress,
            });

            expect(result).toEqual([]);
            expect(mockApi).not.toHaveBeenCalled();
        });

        it('should handle encryption errors and report them via onProgress', async () => {
            const contacts: VCardContact[] = [
                { fn: [{ field: 'fn', value: 'Contact 1' }] } as VCardContact,
                { fn: [{ field: 'fn', value: 'Contact 2' }] } as VCardContact,
            ];

            // trigger encryption fail
            mockPrepareVCardContact.mockRejectedValue(new Error('Encryption failed'));

            const abortController = new AbortController();

            await processContactsInBatches({
                contacts,
                labels: mockLabels,
                overwrite: mockOverwrite,
                keyPair,
                api: mockApi,
                signal: abortController.signal,
                onProgress: mockOnProgress,
            });

            const errorCalls = mockOnProgress.mock.calls.filter((call) => call[2].length > 0);
            expect(errorCalls.length).toBeGreaterThan(0);
            expect(mockApi).not.toHaveBeenCalled();
        });

        it('should handle API submission errors and report them via onProgress', async () => {
            const contacts: VCardContact[] = [{ fn: [{ field: 'fn', value: 'Contact 1' }] } as VCardContact];

            // trigger api error
            mockApi.mockResolvedValue({
                Responses: [
                    {
                        Index: 0,
                        Response: {
                            Code: 0,
                            Error: 'API Error',
                        },
                    },
                ],
            });

            const abortController = new AbortController();

            await processContactsInBatches({
                contacts,
                labels: mockLabels,
                overwrite: mockOverwrite,
                keyPair,
                api: mockApi,
                signal: abortController.signal,
                onProgress: mockOnProgress,
            });

            expect(mockOnProgress).toHaveBeenCalled();
        });
    });
});
