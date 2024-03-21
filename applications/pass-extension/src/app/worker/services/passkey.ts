import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { c } from 'ttag';

import { selectItemByShareIdAndId, selectPasskeys } from '@proton/pass/store/selectors';
import { WorkerMessageType } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { withContext } from '../context';
import store from '../store';

export const createPasskeyService = () => {
    WorkerMessageBroker.registerMessage(WorkerMessageType.PASSKEY_QUERY, ({ payload }) => ({
        passkeys: selectPasskeys(payload)(store.getState()),
    }));

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PASSKEY_CREATE,
        withContext((ctx, { payload: { request, domain } }) => {
            const response = ctx.service.core.bindings?.generate_passkey(domain, request);
            if (!response) throw new Error(c('Error').t`Authenticator failure`);

            return { intercept: true, response };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PASSKEY_GET,
        withContext((ctx, { payload: { domain, passkey: selectedPasskey, request } }) => {
            if (!selectedPasskey) throw new Error(c('Error').t`Missing passkey`);

            const { shareId, itemId } = selectedPasskey;
            const item = selectItemByShareIdAndId<'login'>(shareId, itemId)(store.getState());
            if (!item) throw new Error(c('Error').t`Unknown item`);

            const { passkeys } = item.data.content;
            const passkey = passkeys?.find(({ credentialId }) => selectedPasskey.credentialId === credentialId);
            if (!passkey) throw new Error(c('Error').t`Unknown passkey`);

            const content = base64StringToUint8Array(passkey.content);
            const response = ctx.service.core.bindings?.resolve_passkey_challenge(domain, content, request);

            if (!response) throw new Error(c('Error').t`Authenticator failure`);

            return { intercept: true, response };
        })
    );

    return {};
};

export type Passkeyservice = ReturnType<typeof createPasskeyService>;
