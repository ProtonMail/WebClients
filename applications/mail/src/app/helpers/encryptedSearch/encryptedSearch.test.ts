import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { localisedForwardFlags } from '../../constants';
import { ESMessage, ESBaseMessage, NormalisedSearchParams } from '../../models/encryptedSearch';
import { SearchParameters } from '../../models/tools';
import { isMessageForwarded, prepareMessageMetadata } from './esBuild';
import { applySearch, normaliseSearchParams } from './esSearch';
import { compareESBaseMessages } from './esSync';

describe('encryptedSearch', () => {
    const esMessage: ESMessage = {
        ID: 'ID',
        Order: 0,
        ConversationID: 'ConversationID',
        Subject: 'Subject',
        Unread: 0,
        Sender: { Name: 'Sender', Address: 'SenderAddress' },
        Flags: 0,
        IsReplied: 0,
        IsRepliedAll: 0,
        IsForwarded: 0,
        ToList: [{ Name: 'To', Address: 'ToAddress' }],
        CCList: [{ Name: 'CC', Address: 'CCAddress' }],
        BCCList: [{ Name: 'BCC', Address: 'BCCAddress' }],
        Time: 0,
        Size: 0,
        NumAttachments: 0,
        ExpirationTime: 0,
        AddressID: 'AddressID',
        LabelIDs: ['0'],
        decryptedBody: '',
        decryptionError: false,
        decryptedSubject: '',
    };
    const timeOffset = new Date().getTimezoneOffset() * 60;

    describe('prepareMessageMetadata', () => {
        it('should select the correct fields of ESMessage', () => {
            const baseMessage: ESBaseMessage = {
                ID: 'ID',
                Order: 0,
                ConversationID: 'ConversationID',
                Subject: 'Subject',
                Unread: 0,
                Sender: { Name: 'Sender', Address: 'SenderAddress' },
                Flags: 0,
                IsReplied: 0,
                IsRepliedAll: 0,
                IsForwarded: 0,
                ToList: [],
                CCList: [],
                BCCList: [],
                Time: 0,
                Size: 0,
                NumAttachments: 0,
                ExpirationTime: 0,
                AddressID: 'AddressID',
                LabelIDs: [],
                AttachmentInfo: { 'text/calendar': { attachment: 1 } },
            };
            const message: Message = {
                ...baseMessage,
                ExternalID: 'ExternalID',
                Body: '',
                MIMEType: MIME_TYPES.DEFAULT,
                Header: 'Header',
                ParsedHeaders: {},
                ReplyTo: { Name: 'ReplyTo', Address: 'ReplyToAddress' },
                ReplyTos: [],
                Attachments: [],
                AttachmentInfo: { 'text/calendar': { attachment: 1 } },
            };
            expect(prepareMessageMetadata(message)).toStrictEqual(baseMessage);
        });
    });

    describe('isMessageForwarded', () => {
        it('should detect forwarded messages', () => {
            localisedForwardFlags.forEach((fwFlag) => {
                expect(isMessageForwarded(`${fwFlag.toLocaleUpperCase()} Forwarded Subject`)).toEqual(true);
            });
            expect(isMessageForwarded('Subject')).toEqual(false);
        });
    });

    describe('compareESBaseMessages', () => {
        it('should check equality between ESMessage', () => {
            const esBaseMessage1 = prepareMessageMetadata(esMessage);
            const esBaseMessage2 = { ...esBaseMessage1 };
            expect(compareESBaseMessages(esBaseMessage1, esBaseMessage2)).toStrictEqual(true);
            esBaseMessage2.Order = 1;
            expect(compareESBaseMessages(esBaseMessage1, esBaseMessage2)).toStrictEqual(false);
        });
    });

    describe('normaliseSearchParams', () => {
        const searchParams: SearchParameters = {
            address: 'address',
            from: 'from',
            to: 'to',
            keyword: 'TEST  test',
            begin: 1619679525,
            end: 1619679525,
            attachments: 0,
            wildcard: 0,
        };
        const normalisedSearchParams = normaliseSearchParams(searchParams, '0');

        it('should not return the wildcard', () => {
            expect(normalisedSearchParams).toEqual(expect.not.objectContaining({ wildcard: 0 }));
        });

        it('should return labelID', () => {
            expect(normalisedSearchParams.labelID).toEqual('0');
        });

        it('should normalise keywords', () => {
            expect(normalisedSearchParams.normalisedKeywords).toEqual(['test', 'test']);
        });

        it.skip('should round end time', () => {
            expect(normalisedSearchParams.search.end! - timeOffset).toEqual(1619740799);
        });

        it('should match all other search parameters', () => {
            expect(normalisedSearchParams.search.address).toEqual(searchParams.address);
            expect(normalisedSearchParams.search.from).toEqual(searchParams.from);
            expect(normalisedSearchParams.search.to).toEqual(searchParams.to);
            expect(normalisedSearchParams.search.begin).toEqual(searchParams.begin);
            expect(normalisedSearchParams.search.attachments).toEqual(searchParams.attachments);
        });
    });

    describe('applySearch', () => {
        it('should fail search due to labelID', () => {
            expect(
                applySearch({ labelID: '0' } as NormalisedSearchParams, { ...esMessage, LabelIDs: ['1'] } as ESMessage)
            ).toEqual(false);
        });

        it('should fail search due to address', () => {
            expect(
                applySearch(
                    { labelID: '0', search: { address: 'address' } } as NormalisedSearchParams,
                    { ...esMessage, AddressID: 'AddressID' } as ESMessage
                )
            ).toEqual(false);
        });

        it('should fail search due to begin', () => {
            expect(
                applySearch(
                    { labelID: '0', search: { begin: 1619679525 } } as NormalisedSearchParams,
                    { ...esMessage, Time: 1619679524 } as ESMessage
                )
            ).toEqual(false);
        });

        it('should fail search due to end', () => {
            expect(
                applySearch(
                    { labelID: '0', search: { end: 1619733599 } } as NormalisedSearchParams,
                    { ...esMessage, Time: 1619733600 } as ESMessage
                )
            ).toEqual(false);
        });

        it('should fail search due to attachments', () => {
            expect(
                applySearch(
                    { labelID: '0', search: { attachments: 0 } } as NormalisedSearchParams,
                    { ...esMessage, NumAttachments: 1 } as ESMessage
                )
            ).toEqual(false);
        });

        it('should fail search due to decryptionError', () => {
            expect(applySearch({ labelID: '0', decryptionError: true } as NormalisedSearchParams, esMessage)).toEqual(
                false
            );
        });

        it('should succeed search without keywords', () => {
            expect(applySearch({ labelID: '0' } as NormalisedSearchParams, esMessage)).toEqual(true);
        });

        it('should succeed search with single keyword', () => {
            expect(
                applySearch(
                    { labelID: '0', normalisedKeywords: ['test'] } as NormalisedSearchParams,
                    { ...esMessage, Subject: 'test' } as ESMessage
                )
            ).toEqual(true);
        });

        it('should succeed search with multiple keywords in same property', () => {
            expect(
                applySearch(
                    { labelID: '0', normalisedKeywords: ['test', 'test2'] } as NormalisedSearchParams,
                    { ...esMessage, Subject: 'testtest2' } as ESMessage
                )
            ).toEqual(true);
        });

        it('should succeed search with multiple keywords in different properties', () => {
            expect(
                applySearch(
                    { labelID: '0', normalisedKeywords: ['test', 'test2'] } as NormalisedSearchParams,
                    { ...esMessage, Subject: 'test', Sender: { Address: 'test2', Name: '' } } as ESMessage
                )
            ).toEqual(true);
        });
    });
});
