import createCache from 'proton-shared/lib/helpers/cache';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from 'proton-shared/lib/mail/constants';

import { MessageExtended, MessageKeys } from '../../../models/message';
import { transformEmbedded } from '../transformEmbedded';
import { prepareImages } from '../../embedded/embeddedParser';
import { AttachmentsCache } from '../../../containers/AttachmentProvider';
import { api } from '../../test/helper';

const prepareImagesMock = prepareImages as jest.Mock;

jest.mock('../../embedded/embeddedFinder', () => ({
    find: jest.fn(() => []),
}));

jest.mock('../../embedded/embeddedParser', () => ({
    mutateHTMLBlob: jest.fn(),
    decrypt: jest.fn(),
    prepareImages: jest.fn(),
}));

const attachmentsCache = createCache() as AttachmentsCache;

const data = { Flags: MESSAGE_FLAGS.FLAG_RECEIVED } as Message; // Not a draft

const localID = 'localID';

describe('transformEmbedded', () => {
    describe('show', () => {
        // Reference: Angular/test/specs/message/services/transformEmbedded.spec.js

        const setup = async (message: Partial<MessageExtended> = {}) => {
            await transformEmbedded({ localID, ...message }, {} as MessageKeys, attachmentsCache, api);
            return prepareImagesMock.mock.calls[0][1] as boolean;
        };

        afterEach(() => {
            [prepareImagesMock].forEach((mock) => mock.mockClear());
        });

        it('should load embedded images when showEmbeddedImages = true', async () => {
            const show = await setup({ data, showEmbeddedImages: true });
            expect(show).toBe(true);
        });

        it('should not load embedded images when showEmbedded = false', async () => {
            const show = await setup({ data, showEmbeddedImages: false });
            expect(show).toBe(false);
        });
    });
});
