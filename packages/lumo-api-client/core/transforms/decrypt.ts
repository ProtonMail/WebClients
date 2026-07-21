import { decryptUint8Array } from '../../crypto';
import { consider } from '../../util/nullable';
import type { PendingClientToolCall } from '../client-tools';
import { decryptString } from '../encryption';
import type { RequestEncryptionParams } from '../encryptionParams';
import type {
    GenerationResponseMessage,
    GenerationResponseMessageDecrypted,
    ServerToolCallMessage,
    ServerToolResultMessage,
} from '../types';

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

            // Decrypt server_tool_call arguments (dispatch chunk only — announce has no arguments)
            const shouldDecryptToolCall =
                value.type === 'server_tool_call' &&
                value.encrypted &&
                value.arguments !== undefined &&
                encryption &&
                responseAd;

            if (shouldDecryptToolCall) {
                try {
                    const decryptedArgs = await decryptString(
                        (value as ServerToolCallMessage).arguments!,
                        encryption.requestKey,
                        responseAd
                    );
                    controller.enqueue({ ...value, arguments: decryptedArgs, encrypted: false });
                    return;
                } catch (error) {
                    console.error('Failed to decrypt tool call arguments:', error);
                    return;
                }
            }

            // Decrypt server_tool_result content
            const shouldDecryptToolResult =
                value.type === 'server_tool_result' && value.encrypted && encryption && responseAd;

            if (shouldDecryptToolResult) {
                try {
                    const decryptedContent = await decryptString(
                        (value as ServerToolResultMessage).content,
                        encryption.requestKey,
                        responseAd
                    );
                    controller.enqueue({ ...value, content: decryptedContent, encrypted: false });
                    return;
                } catch (error) {
                    console.error('Failed to decrypt tool result content:', error);
                    return;
                }
            }

            // Decrypt client tool-call arguments streamed as `token_data` with target `tool_call`.
            // When U2L is on the scheduler encrypts the arguments, so `arguments` arrives as a
            // ciphertext STRING rather than a parsed object. Decrypt in place and re-parse so
            // downstream validation sees real args. Server tool calls use the separate
            // `server_tool_call` path above.
            const isClientToolCall = value.type === 'token_data' && value.target === 'tool_call';
            if (isClientToolCall && encryption && responseAd) {
                try {
                    const frame = JSON.parse(value.content) as { id?: string; name?: string; arguments?: unknown };
                    if (typeof frame.arguments === 'string' && frame.arguments.length > 0) {
                        const decryptedArgs = await decryptString(frame.arguments, encryption.requestKey, responseAd);
                        let parsedArgs: unknown = decryptedArgs;
                        try {
                            parsedArgs = JSON.parse(decryptedArgs);
                        } catch {
                            // Leave as the decrypted string. The transport only decrypts and forwards;
                            // validating tool-call arguments — and rejecting / retrying on bad ones — is
                            // the engine's job, so we hand the value on untouched rather than second-guess it.
                        }
                        controller.enqueue({
                            ...value,
                            content: JSON.stringify({ ...frame, arguments: parsedArgs }),
                            encrypted: false,
                        });
                        return;
                    }
                } catch (error) {
                    // Not an encrypted-arguments frame (already-parsed object, or undecryptable) — fall
                    // through and pass it on unchanged for the engine to handle.
                    console.error('Failed to decrypt client tool call arguments:', error);
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

// Native tool calls arrive on the OpenAI `delta.tool_calls` path, whose arguments are
// U2L-encrypted but never pass through the transform above. Decrypt them with the same
// key/associated-data scheme. Arguments that already parse as JSON (unencrypted setups)
// are returned untouched.
export async function decryptToolCallArguments(
    calls: PendingClientToolCall[],
    encryption: RequestEncryptionParams | null
): Promise<PendingClientToolCall[]> {
    const responseAd = consider(makeResponseAd)(encryption?.requestId);
    if (!encryption || !responseAd) {
        return calls;
    }

    return Promise.all(
        calls.map(async (call) => {
            try {
                JSON.parse(call.arguments);
                return call;
            } catch {
                // arguments are not cleartext JSON — attempt decryption below
            }
            try {
                const decrypted = await decryptString(call.arguments, encryption.requestKey, responseAd);
                return { ...call, arguments: decrypted };
            } catch (error) {
                console.error('Failed to decrypt native tool call arguments:', error);
                return call;
            }
        })
    );
}
