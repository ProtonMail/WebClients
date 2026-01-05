import { consider } from '../../../../util/nullable';
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
            const shouldDecrypt =
                value.type === 'token_data' &&
                value.encrypted &&
                enableU2LEncryption &&
                requestKey &&
                requestId &&
                responseAd;
            if (!shouldDecrypt) {
                controller.enqueue(value);
                return;
            }
            try {
                const decryptedContent = await decryptContent(value.content, requestKey, responseAd);
                const decrypted = {
                    ...value,
                    content: decryptedContent,
                    encrypted: false,
                };
                controller.enqueue(decrypted);
            } catch (error) {
                console.error('Failed to decrypt chunk:', error);
                // do nothing - do not emit the encrypted chunk, do not throw an error
            }
        },
    };
};

export const makeDecryptionTransformStream = (
    params: DecryptionTransformerParams
): TransformStream<GenerationToFrontendMessage, GenerationToFrontendMessageDecrypted> =>
    new TransformStream(makeDecryptionTransformer(params));
