import { MIME_TYPES } from 'proton-shared/lib/constants';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { localisedForwardFlags } from '../../constants';
import { CachedMessage, MessageForSearch, NormalisedSearchParams } from '../../models/encryptedSearch';
import { SearchParameters } from '../../models/tools';
import { isMessageForwarded, prepareMessageMetadata } from './esBuild';
import { applySearch, getTimeLimits, normaliseSearchParams, sizeOfCache, splitCachedMessage } from './esSearch';
import { compareMessagesForSearch } from './esSync';

describe('encryptedSearch', () => {
    const messageForSearch: MessageForSearch = {
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
    };
    const cachedMessage: CachedMessage = {
        ...messageForSearch,
        decryptedBody: '',
        decryptedSubject: '',
        decryptionError: false,
    };
    const timeOffset = new Date().getTimezoneOffset() * 60;

    describe('prepareMessageMetadata', () => {
        it('should select the correct fields of MessageForSearch', () => {
            const message: Message = {
                ...messageForSearch,
                SenderAddress: 'SenderAddress',
                SenderName: 'SenderName',
                Type: 0,
                IsEncrypted: 0,
                ExternalID: 'ExternalID',
                Body: '',
                MIMEType: MIME_TYPES.DEFAULT,
                Header: 'Header',
                ParsedHeaders: {},
                ReplyTo: { Name: 'ReplyTo', Address: 'ReplyToAddress' },
                ReplyTos: [],
                Attachments: [],
            };
            expect(prepareMessageMetadata(message)).toStrictEqual(messageForSearch);
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

    describe('compareMessagesForSearch', () => {
        it('should check equality between MessageForSearch', () => {
            const messageForSearch2 = { ...messageForSearch };
            expect(compareMessagesForSearch(messageForSearch, messageForSearch2)).toStrictEqual(true);
            messageForSearch2.Order = 1;
            expect(compareMessagesForSearch(messageForSearch, messageForSearch2)).toStrictEqual(false);
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

        it('should round end time', () => {
            expect(normalisedSearchParams.end! - timeOffset).toEqual(1619740799);
        });

        it('should match all other search parameters', () => {
            expect(normalisedSearchParams.address).toEqual(searchParams.address);
            expect(normalisedSearchParams.from).toEqual(searchParams.from);
            expect(normalisedSearchParams.to).toEqual(searchParams.to);
            expect(normalisedSearchParams.begin).toEqual(searchParams.begin);
            expect(normalisedSearchParams.attachments).toEqual(searchParams.attachments);
        });
    });

    describe('applySearch', () => {
        it('should fail search due to labelID', () => {
            expect(
                applySearch({ labelID: '0' } as NormalisedSearchParams, { LabelIDs: ['1'] } as CachedMessage)
            ).toEqual(false);
        });

        it('should fail search due to address', () => {
            expect(
                applySearch(
                    { labelID: '0', address: 'address' } as NormalisedSearchParams,
                    { LabelIDs: ['0'], AddressID: 'AddressID' } as CachedMessage
                )
            ).toEqual(false);
        });

        it('should fail search due to begin', () => {
            expect(
                applySearch(
                    { labelID: '0', begin: 1619679525 } as NormalisedSearchParams,
                    { LabelIDs: ['0'], Time: 1619679524 } as CachedMessage
                )
            ).toEqual(false);
        });

        it('should fail search due to end', () => {
            expect(
                applySearch(
                    { labelID: '0', end: 1619733599 } as NormalisedSearchParams,
                    { LabelIDs: ['0'], Time: 1619733600 } as CachedMessage
                )
            ).toEqual(false);
        });

        it('should fail search due to attachments', () => {
            expect(
                applySearch(
                    { labelID: '0', attachments: 0 } as NormalisedSearchParams,
                    { LabelIDs: ['0'], NumAttachments: 1 } as CachedMessage
                )
            ).toEqual(false);
        });

        it('should fail search due to decryptionError', () => {
            expect(
                applySearch(
                    { labelID: '0', decryptionError: true } as NormalisedSearchParams,
                    { LabelIDs: ['0'], decryptionError: false } as CachedMessage
                )
            ).toEqual(false);
        });

        it('should succeed search without keywords', () => {
            expect(
                applySearch({ labelID: '0' } as NormalisedSearchParams, { LabelIDs: ['0'] } as CachedMessage)
            ).toEqual(true);
        });

        it('should succeed search with single keyword', () => {
            expect(
                applySearch(
                    { labelID: '0', normalisedKeywords: ['test'] } as NormalisedSearchParams,
                    { LabelIDs: ['0'], Subject: 'test' } as CachedMessage
                )
            ).toEqual(true);
        });

        it('should succeed search with multiple keywords in same property', () => {
            expect(
                applySearch(
                    { labelID: '0', normalisedKeywords: ['test', 'test2'] } as NormalisedSearchParams,
                    { LabelIDs: ['0'], Subject: 'testtest2' } as CachedMessage
                )
            ).toEqual(true);
        });

        it('should succeed search with multiple keywords in different properties', () => {
            expect(
                applySearch(
                    { labelID: '0', normalisedKeywords: ['test', 'test2'] } as NormalisedSearchParams,
                    { LabelIDs: ['0'], Subject: 'test', Sender: { Address: 'test2' } } as CachedMessage
                )
            ).toEqual(true);
        });
    });

    describe('getTimeLimits', () => {
        it('should derive the correct time boundaries without begin and end', () => {
            const { lower, upper } = getTimeLimits(1619679525, undefined, undefined);
            expect(lower[0] - timeOffset).toEqual(1601510400);
            expect(upper[0]).toEqual(1619679524);
            expect(lower[1]).toEqual(0);
            expect(upper[1]).toEqual(9007199254740991);
        });

        it('should derive the correct time boundaries without end', () => {
            const { lower, upper } = getTimeLimits(1619679525, 1619279525, undefined);
            expect(lower[0]).toEqual(1619279525);
            expect(upper[0]).toEqual(1619679524);
        });

        it('should derive the correct time boundaries without begin', () => {
            const { lower, upper } = getTimeLimits(0, undefined, 1619679525);
            expect(lower[0] - timeOffset).toEqual(1601510400);
            expect(upper[0]).toEqual(1619679525);
        });

        it('should derive the correct time boundaries with both begin and end (less than 6 months)', () => {
            const { lower, upper } = getTimeLimits(0, 1619679425, 1619679525);
            expect(lower[0]).toEqual(1619679425);
            expect(upper[0]).toEqual(1619679525);
        });

        it('should derive the correct time boundaries with both begin and end (more than 6 months)', () => {
            const { lower, upper } = getTimeLimits(0, 1519679525, 1619679525);
            expect(lower[0] - timeOffset).toEqual(1601510400);
            expect(upper[0]).toEqual(1619679525);
        });
    });

    describe('splitCachedMessage', () => {
        it('should split a CachedMessage into a MessageForSearch', () => {
            const {
                decryptedBody,
                decryptedSubject,
                decryptionError,
                messageForSearch: splitMessage,
            } = splitCachedMessage(cachedMessage);
            expect(splitMessage).toStrictEqual(messageForSearch);
            expect(decryptedBody).toEqual('');
            expect(decryptedSubject).toEqual('');
            expect(decryptionError).toEqual(false);
        });
    });

    describe('sizeOfCache', () => {
        const esCache: CachedMessage[] = [cachedMessage, cachedMessage, cachedMessage, cachedMessage];
        it('should estimate the size of the entire cache', () => {
            expect(sizeOfCache(esCache)).toEqual(1016);
        });
    });
});
