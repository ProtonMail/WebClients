import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { c } from 'ttag';

import { intoAllowedPasskeys } from '@proton/pass/lib/passkeys/utils';
import { selectItemByShareIdAndId } from '@proton/pass/store/selectors';
import { WorkerMessageType } from '@proton/pass/types';
import { parseUrl } from '@proton/pass/utils/url/parser';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { withContext } from '../context';
import store from '../store';

export interface Passkeyservice {}

export const createPasskeyService = (): Passkeyservice => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PASSKEY_QUERY,
        withContext((ctx, { payload: { credentialIds, domain } }) => {
            const passkeys = ctx.service.autofill
                .getCandidates(parseUrl(domain))
                .filter((item) => item.data.content.passkeys.length > 0)
                .map(intoAllowedPasskeys(credentialIds))
                .flat();

            return { passkeys };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PASSKEY_CREATE,
        withContext((ctx, { payload: { publicKey, domain } }) => {
            const response = ctx.service.core.bindings?.generate_passkey(domain, JSON.stringify(publicKey));
            if (!response) throw new Error(c('Error').t`Authenticator failure`);

            return { intercept: true, response };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PASSKEY_GET,
        withContext((ctx, { payload: { domain, passkey: selectedPasskey, publicKey } }) => {
            if (!selectedPasskey) throw new Error(c('Error').t`Missing passkey`);

            const { shareId, itemId } = selectedPasskey;
            const item = selectItemByShareIdAndId<'login'>(shareId, itemId)(store.getState());
            if (!item) throw new Error(c('Error').t`Unknown item`);

            const { passkeys } = item.data.content;
            const passkey = passkeys.find(({ credentialId }) => selectedPasskey.credentialId === credentialId);
            if (!passkey) throw new Error(c('Error').t`Unknown passkey`);

            const content = base64StringToUint8Array(passkey.content);
            const request = JSON.stringify(publicKey);
            const response = ctx.service.core.bindings?.resolve_passkey_challenge(domain, content, request);
            if (!response) throw new Error(c('Error').t`Authenticator failure`);

            return { intercept: true, response };
        })
    );

    return {};
};
