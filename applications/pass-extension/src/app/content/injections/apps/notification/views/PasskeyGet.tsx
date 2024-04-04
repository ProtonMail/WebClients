import { type FC, useEffect, useMemo } from 'react';

import { createBridgeResponse } from 'proton-pass-extension/app/content/bridge/message';
import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { WithPinUnlock } from 'proton-pass-extension/app/content/injections/apps/components/PinUnlock';
import { NotificationHeader } from 'proton-pass-extension/app/content/injections/apps/notification/components/NotificationHeader';
import type { NotificationAction } from 'proton-pass-extension/app/content/types';
import { type NotificationActions } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll';
import { Icon } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import type { SanitizedPublicKeyRequest, SelectedPasskey } from '@proton/pass/lib/passkeys/types';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { prop } from '@proton/pass/utils/fp/lens';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = Extract<NotificationActions, { action: NotificationAction.PASSKEY_GET }>;

const PasskeyGetView: FC<Props> = ({ domain, request, token }) => {
    const { onTelemetry } = usePassCore();
    const { postMessage, close } = useIFrameContext();
    const { createNotification } = useNotifications();

    const [passkeys, setPasskeys] = useMountedState<MaybeNull<SelectedPasskey[]>>(null);
    const publicKey = useMemo(() => JSON.parse(request) as SanitizedPublicKeyRequest, [request]);

    const authenticate = (passkey: SelectedPasskey) => {
        sendMessage
            .on(
                contentScriptMessage({ type: WorkerMessageType.PASSKEY_GET, payload: { domain, passkey, request } }),
                async (result) => {
                    if (result.type !== 'success') throw new Error(result.error);
                    if (!result.intercept) return createBridgeResponse({ type: 'success', intercept: false }, token);

                    const { response } = result;

                    postMessage(createBridgeResponse({ type: 'success', intercept: true, response }, token));
                    onTelemetry(createTelemetryEvent(TelemetryEventName.PasskeyAuthSuccess, {}, {}));
                    close();
                }
            )
            .catch((err) => {
                const message = getErrorMessage(err);
                createNotification({
                    type: 'error',
                    // translator: Shown with error message on passkey authentication failure
                    text: c('Error').t`Authentication failure: ${message}`,
                });
            });
    };

    useEffect(() => {
        const run = async () => {
            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.PASSKEY_QUERY,
                    payload: { domain, credentialIds: (publicKey.allowCredentials ?? []).map(prop('id')) },
                })
            );

            setPasskeys(response.type === 'success' ? response.passkeys : []);
            onTelemetry(createTelemetryEvent(TelemetryEventName.PasskeysSuggestionsDisplay, {}, {}));
        };

        run().catch(close);
    }, [token]);

    if (!passkeys) return null;

    return (passkeys?.length ?? 0) > 0 ? (
        <Scroll>
            {passkeys.map((passkey, idx) => (
                <ListItem
                    key={`${passkey.credentialId}-${idx}`}
                    className="rounded-xl"
                    icon="pass-passkey"
                    title={passkey.name}
                    subTitle={passkey.username}
                    url={domain}
                    onClick={() => authenticate(passkey)}
                />
            ))}
        </Scroll>
    ) : (
        <Card className="flex flex-auto">
            <div className="flex flex-column justify-center items-center gap-2 mb-2">
                <Icon name="pass-passkey" size={6} />
                <span className="text-center block max-w-2/3">{c('Warning')
                    .t`No passkeys found. Save your passkeys in ${PASS_APP_NAME} to sign-in to ${domain}.`}</span>
            </div>
        </Card>
    );
};

export const PasskeyGet: FC<Props> = (props) => {
    const { postMessage } = useIFrameContext();
    const { token, domain } = props;

    return (
        <div className="ui-violet flex flex-column flex-nowrap justify-space-between h-full gap-2 anime-fade-in">
            <NotificationHeader
                title={c('Info').t`Passkey sign-in`}
                onClose={() => postMessage(createBridgeResponse({ type: 'success', intercept: false }, token))}
            />

            <div className="max-w-full overflow-hidden flex flex-auto flex-column flex-nowrap gap-2">
                <div className="shrink-0 px-1 text-sm">{c('Info')
                    .t`Choose a saved passkey to sign-in to ${domain}`}</div>
                <WithPinUnlock>
                    {(locked, input) =>
                        locked ? (
                            <Card className="flex flex-auto">
                                <div className="flex flex-column justify-center items-center gap-2 mb-2">
                                    <Icon name="lock-filled" size={6} />
                                    <span className="text-center block">
                                        {c('Info')
                                            .t`Unlock ${PASS_APP_NAME} with your PIN code to access your passkeys`}
                                    </span>
                                </div>
                                {input}
                            </Card>
                        ) : (
                            <PasskeyGetView {...props} />
                        )
                    }
                </WithPinUnlock>
            </div>

            <div className="shrink-0 p-1 text-xs color-weak">{c('Info')
                .t`Close this window in order to use a security key or another passkey.`}</div>
        </div>
    );
};
