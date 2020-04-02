import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import createCache from 'proton-shared/lib/helpers/cache';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { MessageExtended } from '../../models/message';
import { transformEmbedded } from './transformEmbedded';
import { prepareImages } from '../embedded/embeddedParser';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { MESSAGE_FLAGS } from '../../constants';
import { api } from '../test/helper';

const prepareImagesMock = prepareImages as jest.Mock;

jest.mock('../embedded/embeddedFinder', () => ({
    find: jest.fn(() => [])
}));

jest.mock('../embedded/embeddedParser', () => ({
    mutateHTMLBlob: jest.fn(),
    decrypt: jest.fn(),
    prepareImages: jest.fn()
}));

const attachmentsCache = createCache() as AttachmentsCache;

const data = { Flags: MESSAGE_FLAGS.FLAG_RECEIVED }; // Not a draft

const localID = 'localID';

describe('transformEmbedded', () => {
    describe('show', () => {
        // Reference: Angular/test/specs/message/services/transformEmbedded.spec.js

        const setup = async (message: Partial<MessageExtended> = {}, mailSettings: Partial<MailSettings> = {}) => {
            await transformEmbedded({ localID, ...message }, attachmentsCache, api, mailSettings as MailSettings);
            return prepareImagesMock.mock.calls[0][1] as boolean;
        };

        afterEach(() => {
            [prepareImagesMock].forEach((mock) => mock.mockClear());
        });

        it('should load embedded images when showEmbeddedImages = true', async () => {
            const show = await setup({ data, showEmbeddedImages: true }, { ShowImages: SHOW_IMAGES.NONE });
            expect(show).toBe(true);
        });

        it('should load embedded images when showEmbedded = false and mailSettings = true', async () => {
            const show = await setup({ data, showEmbeddedImages: false }, { ShowImages: SHOW_IMAGES.EMBEDDED });
            expect(show).toBe(true);
        });

        it('should not load embedded images when showEmbedded = false and showImages = false', async () => {
            const show = await setup({ data, showEmbeddedImages: false }, { ShowImages: SHOW_IMAGES.NONE });
            expect(show).toBe(false);
        });

        it('should not load embedded images when showEmbedded = false and showImages = false', async () => {
            const show = await setup({ data, showEmbeddedImages: false }, { ShowImages: SHOW_IMAGES.NONE });
            expect(show).toBe(false);
        });
    });
});
