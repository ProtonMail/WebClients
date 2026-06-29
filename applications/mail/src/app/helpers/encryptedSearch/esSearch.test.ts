import type { NormalizedSearchParams } from '@proton/encrypted-search/models';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Recipient } from '@proton/shared/lib/interfaces';

import type { ESMessage } from '../../models/encryptedSearch';
import { normaliseSearchParams, testMetadata } from './esSearch';

const buildRecipient = (overrides: Partial<Recipient> = {}): Recipient => ({
    Name: 'Jane Doe',
    Address: 'jane@proton.me',
    ContactID: 'contact-1',
    Group: undefined,
    BimiSelector: null,
    DisplaySenderImage: 0,
    IsProton: 0,
    IsSimpleLogin: 0,
    ...overrides,
});

/**
 * Build a complete ESMessage so tests exercise the real object shape rather than today's subset
 * of fields. Override only what a given test cares about.
 */
const buildESMessage = (overrides: Partial<ESMessage> = {}): ESMessage => ({
    ID: 'message-1',
    Order: 1,
    ConversationID: 'conversation-1',
    Subject: 'A subject',
    Unread: 0,
    Sender: buildRecipient(),
    AddressID: 'address-1',
    Flags: 0,
    IsReplied: 0,
    IsRepliedAll: 0,
    IsForwarded: 0,
    ToList: [buildRecipient({ Name: 'Recipient', Address: 'recipient@proton.me' })],
    CCList: [],
    BCCList: [],
    Time: 1_700_000_000,
    Size: 1024,
    NumAttachments: 0,
    ExpirationTime: undefined,
    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
    AttachmentInfo: undefined,
    AttachmentsMetadata: undefined,
    SnoozeTime: 0,
    ...overrides,
});

const buildNormalizedSearchParams = (overrides: Partial<NormalizedSearchParams> = {}): NormalizedSearchParams => ({
    labelIDs: [MAILBOX_LABEL_IDS.INBOX],
    search: {},
    normalizedKeywords: undefined,
    filter: {},
    sort: { sort: 'Time', desc: true },
    ...overrides,
});

describe('esSearch', () => {
    describe('normaliseSearchParams', () => {
        it('puts the labelID first and appends the searched categories', () => {
            const result = normaliseSearchParams({
                searchParams: { keyword: 'hello' },
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });

            expect(result.labelIDs).toEqual([MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]);
        });

        it('keeps a single labelID when no category is searched', () => {
            const result = normaliseSearchParams({
                searchParams: { keyword: 'hello' },
                labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                categoryIDs: [],
            });

            expect(result.labelIDs).toEqual([MAILBOX_LABEL_IDS.ARCHIVE]);
        });
    });

    describe('testMetadata - label and category matching', () => {
        it('matches a message in the searched mailbox when no category is searched', () => {
            const params = buildNormalizedSearchParams({ labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE] });
            const message = buildESMessage({ LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE] });

            expect(testMetadata(params, message, [], [])).toBe(true);
        });

        it('excludes a message that is not in the searched mailbox', () => {
            const params = buildNormalizedSearchParams({ labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE] });
            const message = buildESMessage({ LabelIDs: [MAILBOX_LABEL_IDS.INBOX] });

            expect(testMetadata(params, message, [], [])).toBe(false);
        });

        it('matches a message that is in both the searched mailbox and the searched category', () => {
            const params = buildNormalizedSearchParams({
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });
            const message = buildESMessage({
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });

            expect(testMetadata(params, message, [], [])).toBe(true);
        });

        // Regression: searching Promotions used to return inbox messages from other categories
        // because the INBOX label alone satisfied a single OR over [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS].
        it('excludes an inbox message that belongs to a different category', () => {
            const params = buildNormalizedSearchParams({
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });
            const message = buildESMessage({
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
            });

            expect(testMetadata(params, message, [], [])).toBe(false);
        });

        // Regression: a message that left the inbox but kept its category label must not show up.
        it('excludes a message that has the searched category but is no longer in the inbox', () => {
            const params = buildNormalizedSearchParams({
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });
            const message = buildESMessage({
                LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });

            expect(testMetadata(params, message, [], [])).toBe(false);
        });

        // The default category tab searches the default category plus any disabled categories.
        it('matches a message in any of the searched categories on the default tab', () => {
            const params = buildNormalizedSearchParams({
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                ],
            });
            const message = buildESMessage({ LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL] });

            expect(testMetadata(params, message, [], [])).toBe(true);
        });

        it('excludes a message whose category is not among the searched categories on the default tab', () => {
            const params = buildNormalizedSearchParams({
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
            });
            const message = buildESMessage({
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });

            expect(testMetadata(params, message, [], [])).toBe(false);
        });
    });

    describe('testMetadata - other metadata filters still apply', () => {
        it('excludes an expired message', () => {
            const params = buildNormalizedSearchParams({ labelIDs: [MAILBOX_LABEL_IDS.INBOX] });
            const message = buildESMessage({ LabelIDs: [MAILBOX_LABEL_IDS.INBOX], ExpirationTime: 1 });

            expect(testMetadata(params, message, [], [])).toBe(false);
        });

        it('excludes a read message when the unread filter is on', () => {
            const params = buildNormalizedSearchParams({ labelIDs: [MAILBOX_LABEL_IDS.INBOX], filter: { Unread: 1 } });
            const message = buildESMessage({ LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Unread: 0 });

            expect(testMetadata(params, message, [], [])).toBe(false);
        });

        it('excludes a message without attachments when the attachments filter is on', () => {
            const params = buildNormalizedSearchParams({
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
                filter: { Attachments: 1 },
            });
            const message = buildESMessage({ LabelIDs: [MAILBOX_LABEL_IDS.INBOX], NumAttachments: 0 });

            expect(testMetadata(params, message, [], [])).toBe(false);
        });
    });
});
