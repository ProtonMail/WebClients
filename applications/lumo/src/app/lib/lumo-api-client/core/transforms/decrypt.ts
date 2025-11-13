import { decryptUint8Array } from 'applications/lumo/src/app/crypto';
import { consider } from 'applications/lumo/src/app/util/nullable';

import { decryptContent } from '../encryption';
import type { AesGcmCryptoKey, GenerationToFrontendMessage, GenerationToFrontendMessageDecrypted } from '../types';

export type DecryptionTransformerParams = {
    enableU2LEncryption: boolean;
    requestKey: AesGcmCryptoKey | undefined;
    requestId: string | undefined;
};

function makeResponseAd(requestId: string) {
    return `lumo.response.${requestId}.chunk`;
}

const makeDecryptionTransformer = ({
    enableU2LEncryption,
    requestKey,
    requestId,
}: DecryptionTransformerParams): Transformer<GenerationToFrontendMessage, GenerationToFrontendMessageDecrypted> => {
    const responseAd = consider(makeResponseAd)(requestId);
    return {
        async transform(value: GenerationToFrontendMessage, controller: TransformStreamDefaultController) {
            // Decrypt token_data (text chunks)
            const shouldDecryptText =
                value.type === 'token_data' &&
                value.encrypted &&
                enableU2LEncryption &&
                requestKey &&
                requestId &&
                responseAd;

            if (shouldDecryptText) {
                try {
                    const decryptedContent = await decryptContent(value.content, requestKey, responseAd);
                    const decrypted = {
                        ...value,
                        content: decryptedContent,
                        encrypted: false,
                    };
                    controller.enqueue(decrypted);
                    return;
                } catch (error) {
                    console.error('Failed to decrypt chunk:', error);
                    // do nothing - do not emit the encrypted chunk, do not throw an error
                    return;
                }
            }

            // Decrypt image_data (binary chunks)
            const shouldDecryptImage =
                value.type === 'image_data' &&
                value.encrypted &&
                value.data &&
                enableU2LEncryption &&
                requestKey &&
                requestId &&
                responseAd;

            if (shouldDecryptImage) {
                try {
                    // Decrypt to binary image bytes (decryptUint8Array handles base64 decode internally)
                    const imageBytes = await decryptUint8Array(value.data!, requestKey, responseAd);
                    // Re-encode to base64 for display
                    const decryptedData = imageBytes.toBase64();
                    const decrypted = {
                        ...value,
                        data: decryptedData,
                        encrypted: false,
                    };
                    controller.enqueue(decrypted);
                    return;
                } catch (error) {
                    console.error('Failed to decrypt image data:', error);
                    // do nothing - do not emit the encrypted chunk, do not throw an error
                    return;
                }
            }

            // Pass through unencrypted chunks or chunks we can't decrypt
            controller.enqueue(value);
        },
    };
};

export const makeDecryptionTransformStream = (
    params: DecryptionTransformerParams
): TransformStream<GenerationToFrontendMessage, GenerationToFrontendMessageDecrypted> =>
    new TransformStream(makeDecryptionTransformer(params));
