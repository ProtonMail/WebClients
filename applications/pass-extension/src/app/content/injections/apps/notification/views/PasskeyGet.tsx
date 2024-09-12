import { type FC, useEffect } from 'react';

import { createBridgeResponse } from 'proton-pass-extension/app/content/bridge/message';
import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { WithPinUnlock } from 'proton-pass-extension/app/content/injections/apps/components/PinUnlock';
import { NotificationHeader } from 'proton-pass-extension/app/content/injections/apps/notification/components/NotificationHeader';
import type { NotificationAction } from 'proton-pass-extension/app/content/types';
import { type NotificationActions } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll';
import { Icon } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import type { SelectedPasskey } from '@proton/pass/lib/passkeys/types';
import { WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = Extract<NotificationActions, { action: NotificationAction.PASSKEY_GET }>;

const PasskeyGetView: FC<Props> = ({ domain, request, token, passkeys }) => {
    const { onTelemetry } = usePassCore();
    const { postMessage, close } = useIFrameContext();
    const { createNotification } = useNotifications();

    const authenticate = (passkey: SelectedPasskey) => {
        sendMessage
            .on(
                contentScriptMessage({ type: WorkerMessageType.PASSKEY_GET, payload: { domain, passkey, request } }),
                async (result) => {
                    if (result.type !== 'success') throw new Error(result.error);

                    if (!result.intercept) {
                        return createBridgeResponse<WorkerMessageType.PASSKEY_GET>(
                            { type: 'success', intercept: false },
                            token
                        );
                    }

                    postMessage(
                        createBridgeResponse<WorkerMessageType.PASSKEY_GET>(
                            { type: 'success', intercept: true, response: result.response },
                            token
                        )
                    );

                    onTelemetry(TelemetryEventName.PasskeyAuthSuccess, {}, {});
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
        onTelemetry(TelemetryEventName.PasskeysSuggestionsDisplay, {}, {});
    }, [token]);

    return (
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
    );
};

export const PasskeyGet: FC<Props> = (props) => {
    const { postMessage } = useIFrameContext();
    const { token, domain } = props;

    return (
        <div className="ui-violet flex flex-column flex-nowrap justify-space-between h-full gap-2 anime-fade-in">
            <NotificationHeader
                title={c('Info').t`Passkey sign-in`}
                onClose={() =>
                    postMessage(
                        createBridgeResponse<WorkerMessageType.PASSKEY_GET>(
                            { type: 'success', intercept: false },
                            token
                        )
                    )
                }
            />

            <div className="max-w-full overflow-hidden flex flex-auto flex-column flex-nowrap gap-2">
                <div className="shrink-0 px-1 text-sm">{c('Info')
                    .t`Choose a saved passkey to sign-in to ${domain}`}</div>
                <WithPinUnlock>
                    {(locked, input) =>
                        locked ? (
                            <Card className="flex flex-auto text-sm" type="primary">
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
