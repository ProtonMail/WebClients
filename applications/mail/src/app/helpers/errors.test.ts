import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';
import type { MessageErrors, MessageState } from '@proton/mail/store/messages/messagesTypes';

import type { ConversationErrors } from '../store/conversations/conversationsTypes';
import { hasError, hasErrorType, isDecryptionError, isNetworkError, pickMessageInfosForSentry } from './errors';

describe('isNetworkError', () => {
    it('should be a network error', () => {
        const error1 = {
            name: 'NetworkError',
        };

        const error2 = {
            name: 'OfflineError',
        };

        const error3 = {
            name: 'TimeoutError',
        };

        expect(isNetworkError(error1)).toBeTruthy();
        expect(isNetworkError(error2)).toBeTruthy();
        expect(isNetworkError(error3)).toBeTruthy();
    });

    it('should not be a network error', () => {
        const error1 = {};

        const error2 = {
            name: 'Something else',
        };

        expect(isNetworkError(error1)).toBeFalsy();
        expect(isNetworkError(error2)).toBeFalsy();
    });
});

describe('isDecryptionError', () => {
    it('should be a decryption error', function () {
        const error = {
            message: 'Error decrypting something',
        };

        expect(isDecryptionError(error)).toBeTruthy();
    });

    it('should not be a decryption error', function () {
        const error1 = {
            message: 'something Error decrypting something',
        };

        const error2 = {
            message: 'something else',
        };

        const error3 = {};

        expect(isDecryptionError(error1)).toBeFalsy();
        expect(isDecryptionError(error2)).toBeFalsy();
        expect(isDecryptionError(error3)).toBeFalsy();
    });
});

describe('hasError', () => {
    it('should have errors', function () {
        const messageErrors = {
            network: [{ message: 'something failed' }],
        } as MessageErrors;
        const conversationErrors = {
            network: [{ message: 'something failed' }],
        } as ConversationErrors;

        expect(hasError(messageErrors)).toBeTruthy();
        expect(hasError(conversationErrors)).toBeTruthy();
    });

    it('should not have errors', () => {
        const messageErrors1 = {
            network: [],
        } as MessageErrors;
        const messageErrors2 = {} as MessageErrors;

        const conversationErrors1 = {
            network: [],
        } as ConversationErrors;
        const conversationErrors2 = {} as ConversationErrors;

        expect(hasError(messageErrors1)).toBeFalsy();
        expect(hasError(messageErrors2)).toBeFalsy();
        expect(hasError(conversationErrors1)).toBeFalsy();
        expect(hasError(conversationErrors2)).toBeFalsy();
        expect(hasError(undefined)).toBeFalsy();
    });
});

describe('hasErrorType', () => {
    it('should have error from type network', function () {
        const messageErrors = {
            network: [{ message: 'something failed' }],
        } as MessageErrors;

        const conversationErrors = {
            network: [{ message: 'something failed' }],
        } as ConversationErrors;

        expect(hasErrorType(messageErrors, 'network')).toBeTruthy();
        expect(hasErrorType(conversationErrors, 'network')).toBeTruthy();
    });

    it('should not have error from type network', function () {
        const messageErrors1 = {
            decryption: [{ message: 'something failed' }],
        } as MessageErrors;
        const messageErrors2 = {} as MessageErrors;

        const conversationErrors1 = {
            notExist: [{ message: 'something failed' }],
        } as ConversationErrors;
        const conversationErrors2 = {} as ConversationErrors;

        expect(hasErrorType(messageErrors1, 'network')).toBeFalsy();
        expect(hasErrorType(messageErrors2, 'network')).toBeFalsy();
        expect(hasErrorType(conversationErrors1, 'network')).toBeFalsy();
        expect(hasErrorType(conversationErrors2, 'network')).toBeFalsy();
        expect(hasErrorType(undefined, 'network')).toBeFalsy();
    });
});

describe('pickMessageInfosForSentry', () => {
    it('should not send sensitive infos to Sentry', () => {
        const message = {
            localID: 'localID',
            loadRetry: 2,
            errors: {
                network: [{ message: 'something failed' }],
            },
            data: {
                Subject: 'Mail subject',
                ToList: [{ Name: 'Name', Address: 'address@pm.me' }],
            },
            decryption: {
                decryptedBody: 'Message body',
            },
            messageDocument: {
                document: parseDOMStringToBodyElement('Message body'),
            },
        } as MessageState;

        const expected = {
            localID: 'localID',
            loadRetry: 2,
            errors: {
                network: [{ message: 'something failed' }],
            },
        };

        expect(pickMessageInfosForSentry(message)).toEqual(expected);
    });
});
