import { BinaryResult } from 'pmcrypto';

import { MessageExtended } from '../../models/message';
import { MailSettings, Api } from '../../models/utils';
import { transformEmbedded } from './transformEmbedded';
import { prepareImages } from '../embedded/embeddedParser';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { AttachmentsCache } from '../../hooks/useAttachments';

const prepareImagesMock = prepareImages as jest.Mock;

jest.mock('../embedded/embeddedFinder', () => ({
    find: jest.fn(() => [])
}));

jest.mock('../embedded/embeddedParser', () => ({
    mutateHTML: jest.fn(),
    decrypt: jest.fn(),
    prepareImages: jest.fn()
}));

const attachmentsCache = { data: new Map<string, BinaryResult>() } as AttachmentsCache;
const api: Api = jest.fn();
const cache: any = {};

describe('transformEmbedded', () => {
    describe('show', () => {
        // Reference: Angular/test/specs/message/services/transformEmbedded.spec.js

        const setup = async (message: MessageExtended = {}, mailSettings: MailSettings = {}) => {
            await transformEmbedded(message, { mailSettings, attachmentsCache, api, cache });
            return prepareImagesMock.mock.calls[0][1] as boolean;
        };

        afterEach(() => {
            [prepareImagesMock].forEach((mock) => mock.mockClear());
        });

        it('should load embedded images when showEmbeddedImages = true', async () => {
            const show = await setup({ showEmbeddedImages: true }, { ShowImages: SHOW_IMAGES.NONE });
            expect(show).toBe(true);
        });

        it('should load embedded images when showEmbedded = false and mailSettings = true', async () => {
            const show = await setup({ showEmbeddedImages: false }, { ShowImages: SHOW_IMAGES.EMBEDDED });
            expect(show).toBe(true);
        });

        it('should not load embedded images when showEmbedded = false and showImages = false', async () => {
            const show = await setup({ showEmbeddedImages: false }, { ShowImages: SHOW_IMAGES.NONE });
            expect(show).toBe(false);
        });

        it('should not load embedded images when showEmbedded = false and showImages = false', async () => {
            const show = await setup({ showEmbeddedImages: false }, { ShowImages: SHOW_IMAGES.NONE });
            expect(show).toBe(false);
        });
    });
});
