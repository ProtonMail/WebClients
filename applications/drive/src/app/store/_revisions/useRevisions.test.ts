import { renderHook } from '@testing-library/react-hooks';

import { VERIFICATION_STATUS } from '@proton/crypto';
import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { sendErrorReport } from '../../utils/errorHandling';
import { useDriveCrypto } from '../_crypto';
import { useDownload } from '../_downloads';
import { useLink } from '../_links';
import { ParsedExtendedAttributes, decryptExtendedAttributes } from '../_links/extendedAttributes';
import useRevisions from './useRevisions';

jest.mock('../_crypto');
jest.mock('../_downloads', () => ({
    useDownload: jest.fn(),
}));
jest.mock('../_links', () => ({
    useLink: jest.fn(),
}));

jest.mock('../_links/extendedAttributes');
jest.mock('../../utils/errorHandling');
jest.mock('@proton/shared/lib/api/helpers/apiErrorHelper');

const mockedGetVerificationKey = jest.fn();
const mockedGetLinkPrivateKey = jest.fn();
const mockedDecryptExtendedAttributes = jest.mocked(decryptExtendedAttributes);
const mockedSendErrorReport = jest.mocked(sendErrorReport);
const mockedGetIsConnectionIssue = jest.mocked(getIsConnectionIssue);

jest.mocked(useDriveCrypto).mockImplementation(() => ({
    ...jest.requireMock('../_crypto').useDriveCrypto,
    getVerificationKey: mockedGetVerificationKey,
}));

jest.mocked(useLink).mockImplementation(() => ({
    ...jest.requireMock('../_links').useDriveCrypto,
    getLinkPrivateKey: mockedGetLinkPrivateKey,
}));

const mockedCheckFirstBlockSignature = jest.fn();
jest.mocked(useDownload).mockImplementation(() => ({
    ...jest.requireMock('../_downloads').useDownload,
    checkFirstBlockSignature: mockedCheckFirstBlockSignature,
}));

jest.mocked(decryptExtendedAttributes);

const revisionXattrs: ParsedExtendedAttributes = {
    Common: {
        ModificationTime: 1681715947,
    },
};
const revisionEncryptedXattrs = 'encryptedXattrs';
const revisionSignatureAddress = 'revisionSignatureAddress';
const shareId = 'shareId';
const linkId = 'linkId';

describe('useRevision', () => {
    let abortSignal: AbortSignal;

    beforeEach(() => {
        abortSignal = new AbortController().signal;
    });

    it('getRevisionDecryptedXattrs', async () => {
        mockedGetVerificationKey.mockResolvedValue(['key']);
        mockedGetLinkPrivateKey.mockResolvedValue('privateKey');
        mockedDecryptExtendedAttributes.mockResolvedValue({
            xattrs: revisionXattrs,
            verified: VERIFICATION_STATUS.SIGNED_AND_VALID,
        });
        const {
            result: {
                current: { getRevisionDecryptedXattrs },
            },
        } = renderHook(() => useRevisions(shareId, linkId));
        const result = await getRevisionDecryptedXattrs(abortSignal, revisionEncryptedXattrs, revisionSignatureAddress);

        expect(mockedGetVerificationKey).toHaveBeenCalledWith(revisionSignatureAddress);
        expect(mockedGetLinkPrivateKey).toHaveBeenCalledWith(abortSignal, shareId, linkId);
        expect(mockedDecryptExtendedAttributes).toHaveBeenCalledWith(revisionEncryptedXattrs, 'privateKey', ['key']);
        expect(result).toStrictEqual({
            xattrs: revisionXattrs,
            signatureIssues: {
                xattrs: VERIFICATION_STATUS.SIGNED_AND_VALID,
            },
        });
    });

    it('getRevisionDecryptedXattrs should sendErrorReport if a promise failed', async () => {
        mockedDecryptExtendedAttributes.mockResolvedValue({
            xattrs: revisionXattrs,
            verified: VERIFICATION_STATUS.SIGNED_AND_VALID,
        });
        mockedGetVerificationKey.mockResolvedValue(['key']);
        const error = new Error('getLinkPrivateKey error');
        mockedGetLinkPrivateKey.mockRejectedValue(error);
        const {
            result: {
                current: { getRevisionDecryptedXattrs },
            },
        } = renderHook(() => useRevisions(shareId, linkId));
        const result = await getRevisionDecryptedXattrs(abortSignal, revisionEncryptedXattrs, revisionSignatureAddress);
        expect(result).toBeUndefined();
        expect(mockedSendErrorReport).toHaveBeenCalledWith(error);
    });

    it('checkRevisionSignature result should be undefined if no issues', async () => {
        const revisionId = 'revisionId';
        mockedCheckFirstBlockSignature.mockResolvedValueOnce(undefined);
        const {
            result: {
                current: { checkRevisionSignature },
            },
        } = renderHook(() => useRevisions(shareId, linkId));
        const result = await checkRevisionSignature(abortSignal, revisionId);
        expect(mockedCheckFirstBlockSignature).toHaveBeenCalledWith(abortSignal, shareId, linkId, revisionId);
        expect(result).toBeUndefined();
    });

    it('checkRevisionSignature should throw an error if there is connection issues', async () => {
        const revisionId = 'revisionId';
        const error = new Error('Network error');
        mockedCheckFirstBlockSignature.mockRejectedValue(error);
        mockedGetIsConnectionIssue.mockReturnValue(true);
        const {
            result: {
                current: { checkRevisionSignature },
            },
        } = renderHook(() => useRevisions(shareId, linkId));
        const errorResult = checkRevisionSignature(abortSignal, revisionId);
        await expect(errorResult).rejects.toThrowError(error);
        expect(mockedGetIsConnectionIssue).toHaveBeenCalledWith(error);
    });

    it('checkRevisionSignature should sendErrorReport and return signatureIssues', async () => {
        const revisionId = 'revisionId';
        const error = new Error('checkFirstBlockSignature error');
        mockedCheckFirstBlockSignature.mockRejectedValue(error);
        mockedGetIsConnectionIssue.mockReturnValue(false);
        const {
            result: {
                current: { checkRevisionSignature },
            },
        } = renderHook(() => useRevisions(shareId, linkId));
        const result = await checkRevisionSignature(abortSignal, revisionId);
        expect(mockedSendErrorReport).toHaveBeenCalledWith(error);
        expect(result).toStrictEqual({
            contentKeyPacket: VERIFICATION_STATUS.NOT_SIGNED,
            blocks: VERIFICATION_STATUS.NOT_SIGNED,
            thumbnail: VERIFICATION_STATUS.NOT_SIGNED,
        });
    });
});
