import { WAIT_TIME } from '../constants';
import { EncryptedBlock, Link, ThumbnailEncryptedBlock } from '../interface';
import { ThumbnailType } from '../media';
import { UploadingBlock, UploadingBlockControl } from './interface';

export function waitFor(callback: () => boolean, timeout = 100): Promise<string> {
    return new Promise((resolve, reject) => {
        let time = 0;
        const waitForCondition = () => {
            if (callback()) {
                return resolve('OK');
            }
            if (time > timeout) {
                return reject(new Error('Condition was not met in time'));
            }
            time += WAIT_TIME;
            setTimeout(waitForCondition, WAIT_TIME);
        };
        waitForCondition();
    });
}

export function createBlock(index: number): EncryptedBlock {
    const data = Uint8Array.from(Array.from(`data${index}`).map((letter) => letter.charCodeAt(0)));
    const hash = Uint8Array.from(Array.from(`hash${index}`).map((letter) => letter.charCodeAt(0)));
    const token = Uint8Array.from(Array.from(`token${index}`).map((letter) => letter.charCodeAt(0)));
    return {
        index,
        originalSize: 100 + index,
        encryptedData: data,
        hash,
        signature: `sig${index}`,
        verificationToken: token,
    };
}

export function createThumbnailBlock(index: number, thumbnailType: ThumbnailType): ThumbnailEncryptedBlock {
    const data = Uint8Array.from(Array.from(`data${index}`).map((letter) => letter.charCodeAt(0)));
    const hash = Uint8Array.from(Array.from(`hash${index}`).map((letter) => letter.charCodeAt(0)));
    return {
        index,
        originalSize: 0,
        encryptedData: data,
        hash,
        thumbnailType,
    };
}

export function createUploadingBlock(index: number, isTokenExpired = () => false): UploadingBlock {
    const block = createBlock(index);
    return {
        block,
        uploadLink: `link${index}`,
        uploadToken: `token${index}`,
        isTokenExpired,
    };
}
export function createThumbnailUploadingBlock(
    index: number,
    isTokenExpired = () => false,
    thumbnailType: ThumbnailType
): UploadingBlock {
    const block = createThumbnailBlock(index, thumbnailType);
    return {
        block,
        uploadLink: `link${index}`,
        uploadToken: `token${index}`,
        isTokenExpired,
    };
}

export function createUploadingBlockControl(
    index: number,
    mockFinish = jest.fn(),
    mockOnTokenExpiration = jest.fn()
): UploadingBlockControl {
    const block = createUploadingBlock(index);
    return {
        index: block.block.index,
        originalSize: block.block.originalSize,
        encryptedData: block.block.encryptedData,
        uploadLink: block.uploadLink,
        uploadToken: block.uploadToken,
        isTokenExpired: block.isTokenExpired,
        finish: mockFinish,
        onTokenExpiration: mockOnTokenExpiration,
    };
}

export function createLink(index: number): Link {
    return {
        index,
        token: `token${index}`,
        url: `link${index}`,
    };
}
