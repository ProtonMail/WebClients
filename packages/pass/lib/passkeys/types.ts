import type { WasmGeneratePasskeyResponse, WasmResolvePasskeyChallengeResponse } from '@protontech/pass-rust-core';

import type { SelectedItem } from '@proton/pass/types';
import type { Passkey } from '@proton/pass/types/protobuf/item-v1';
import type { SanitizedBuffers } from '@proton/pass/utils/buffer/sanitization';

export type SanitizedPublicKeyCreate = SanitizedBuffers<PublicKeyCredentialCreationOptions>;
export type SanitizedPublicKeyRequest = SanitizedBuffers<PublicKeyCredentialRequestOptions>;
export type SanitizedPasskey = SanitizedBuffers<Passkey>;
export type SelectedPasskey = SelectedItem & { name: string; username: string; credentialId: string };

type WebAuthnIntercept<T> = { intercept: false } | { intercept: true; response: T };

export type PasskeyCreatePayload = { domain: string; publicKey: SanitizedPublicKeyCreate };
export type PasskeyCreateResponse = WebAuthnIntercept<WasmGeneratePasskeyResponse>;

export type PasskeyQueryPayload = { credentialIds: string[]; domain: string };
export type PasskeyGetPayload = { domain: string; publicKey: SanitizedPublicKeyRequest; passkey?: SelectedPasskey };
export type PasskeyGetResponse = WebAuthnIntercept<WasmResolvePasskeyChallengeResponse>;
