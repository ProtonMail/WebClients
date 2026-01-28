import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import browser from '@proton/pass/lib/globals/browser';
import { selectPasskeys } from '@proton/pass/store/selectors/autofill';
import { selectItem } from '@proton/pass/store/selectors/items';
import type { Maybe, TabId } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export class PasskeyRequestError extends Error {
    name = 'PasskeyRequestError';
    constructor(message: string) {
        super(`Invalid request: ${message}`);
    }
}

/** WebAuthn requires valid origins to have HTTPS scheme OR HTTP scheme with
 * localhost hostname only. Note: RP ID validation (domain suffix checks) is
 * handled by the rust library. This function only enforces origin requirements. */
export function assertValidPasskeyRequest(requestHostname: Maybe<string>, tabUrl: Maybe<URL>): asserts tabUrl is URL {
    if (!requestHostname) throw new PasskeyRequestError('no domain');
    if (!tabUrl) throw new PasskeyRequestError('unknown sender');

    const { hostname, protocol } = tabUrl;

    if (hostname !== requestHostname) throw new PasskeyRequestError('domain mistmatch');
    if (protocol !== 'https:' && !(hostname === 'localhost' && protocol === 'http:')) {
        throw new PasskeyRequestError('insecure protocol');
    }
}

const getTabURL = async (tabID?: TabId): Promise<Maybe<URL>> => {
    const tabUrl = tabID ? (await browser.tabs.get(tabID)).url : undefined;
    if (tabUrl) return new URL(tabUrl);
};

export const createPasskeyService = () => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PASSKEY_QUERY,
        withContext(async (ctx, { payload }, { tab }) => {
            const tabUrl = await getTabURL(tab?.id);
            assertValidPasskeyRequest(payload.domain, tabUrl);

            return { passkeys: selectPasskeys(payload)(ctx.service.store.getState()) };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PASSKEY_CREATE,
        withContext(async (ctx, { payload: { request, domain } }, { tab }) => {
            const tabUrl = await getTabURL(tab?.id);
            assertValidPasskeyRequest(domain, tabUrl);

            logger.debug(`[PasskeyService] registration on ${tabUrl.origin}`);
            const response = await ctx.service.core.generate_passkey(tabUrl.origin, request, true);

            return { intercept: true, response };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PASSKEY_GET,
        withContext(async (ctx, { payload: { domain, passkey: selectedPasskey, request } }, { tab }) => {
            const tabUrl = await getTabURL(tab?.id);
            assertValidPasskeyRequest(domain, tabUrl);

            if (!selectedPasskey) throw new Error(c('Error').t`Missing passkey`);

            const { shareId, itemId, credentialId } = selectedPasskey;
            const item = selectItem<'login'>(shareId, itemId)(ctx.service.store.getState());
            if (!item) throw new Error(c('Error').t`Unknown item`);

            const { passkeys } = item.data.content;
            const passkey = passkeys?.find((pk) => credentialId === pk.credentialId);
            if (!passkey) throw new Error(c('Error').t`Unknown passkey`);

            logger.debug(`[PasskeyService] authentication on ${tabUrl.origin}`);
            const content = Uint8Array.fromBase64(passkey.content);
            const response = await ctx.service.core.resolve_passkey_challenge(tabUrl.origin, content, request, true);

            return { intercept: true, response };
        })
    );

    return {};
};

export type Passkeyservice = ReturnType<typeof createPasskeyService>;
