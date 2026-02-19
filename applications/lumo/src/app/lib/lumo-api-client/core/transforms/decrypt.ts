import { decryptUint8Array } from '../../../../crypto';
import { consider } from '../../../../util/nullable';
import { decryptString } from '../encryption';
import type { RequestEncryptionParams } from '../encryptionParams';
import type { GenerationResponseMessage, GenerationResponseMessageDecrypted } from '../types';

export type DecryptionTransformerParams = {
    encryption: RequestEncryptionParams | null;
};

function makeResponseAd(requestId: string) {
    return `lumo.response.${requestId}.chunk`;
}

const makeDecryptionTransformer = (
    encryption: RequestEncryptionParams | null
): Transformer<GenerationResponseMessage, GenerationResponseMessageDecrypted> => {
    const responseAd = consider(makeResponseAd)(encryption?.requestId);
    return {
        async transform(value: GenerationResponseMessage, controller: TransformStreamDefaultController) {
            // Decrypt token_data (text chunks)
            const shouldDecryptText = value.type === 'token_data' && value.encrypted && encryption && responseAd;

            if (shouldDecryptText) {
                try {
                    const decryptedContent = await decryptString(value.content, encryption.requestKey, responseAd);
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
                value.type === 'image_data' && value.encrypted && value.data && encryption && responseAd;

            if (shouldDecryptImage) {
                try {
                    // Decrypt to binary image bytes (decryptUint8Array handles base64 decode internally)
                    const imageBytes = await decryptUint8Array(value.data!, encryption.requestKey, responseAd);
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
    encryption: RequestEncryptionParams | null
): TransformStream<GenerationResponseMessage, GenerationResponseMessageDecrypted> =>
    new TransformStream(makeDecryptionTransformer(encryption));
