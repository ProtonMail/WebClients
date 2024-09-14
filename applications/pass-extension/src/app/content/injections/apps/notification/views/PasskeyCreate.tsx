import { type FC, useEffect, useMemo } from 'react';

import type { FormikContextType, FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { createBridgeResponse } from 'proton-pass-extension/app/content/bridge/message';
import { AutosaveVaultPicker } from 'proton-pass-extension/app/content/injections/apps/components/AutosaveVaultPicker';
import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { WithPinUnlock } from 'proton-pass-extension/app/content/injections/apps/components/PinUnlock';
import { NotificationHeader } from 'proton-pass-extension/app/content/injections/apps/notification/components/NotificationHeader';
import type { NotificationAction } from 'proton-pass-extension/app/content/types';
import { type NotificationActions } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Button, Scroll } from '@proton/atoms';
import { Icon } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import type { SanitizedPublicKeyCreate } from '@proton/pass/lib/passkeys/types';
import { sanitizePasskey } from '@proton/pass/lib/passkeys/utils';
import { validateItemName } from '@proton/pass/lib/validation/item';
import type { LoginItemPreview, MaybeNull, SelectedItem } from '@proton/pass/types';
import { AutosaveMode, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { throwError } from '@proton/pass/utils/fp/throw';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Step = 'select' | 'passkey';
type FormValues = { name: string; step: Step; selectedItem?: SelectedItem; shareId?: string };
const formId = 'create-passkey';

type PasskeyCreateViewProps = {
    domain: string;
    form: FormikContextType<FormValues>;
    loading: boolean;
    username: string;
};

const PasskeyCreateView: FC<PasskeyCreateViewProps> = ({ domain, form, loading, username }) => {
    const { onTelemetry } = usePassCore();
    const { close, settings } = useIFrameContext();
    const [items, setItems] = useMountedState<MaybeNull<LoginItemPreview[]>>(null);

    useEffect(() => {
        const run = async () => {
            const response = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOFILL_LOGIN_QUERY,
                    payload: { domain, writable: true },
                })
            );

            const candidates = response.type === 'success' ? response.items : [];
            await form.setFieldValue('step', candidates.length > 0 ? 'items' : 'passkey');
            setItems(candidates);
            onTelemetry(TelemetryEventName.PasskeyCreateDisplay, {}, {});
        };

        run().catch(close);
    }, []);

    return items ? (
        <>
            {form.values.step === 'select' && (
                <>
                    <div className="shrink-0 py-1 px-2">
                        {`${c('Label').t`Passkey`} • ${domain}`}
                        <span className="block text-xs color-weak">{c('Info')
                            .t`Select an existing login or create a new one.`}</span>
                    </div>

                    <Scroll>
                        {items.map(({ itemId, shareId, url, userIdentifier, name }) => (
                            <ListItem
                                key={`${shareId}-${itemId}`}
                                className="rounded-xl"
                                icon="pass-passkey"
                                title={name}
                                subTitle={userIdentifier}
                                url={url}
                                onClick={() =>
                                    form
                                        .setValues({ selectedItem: { itemId, shareId }, step: 'select', name })
                                        .then(() => form.handleSubmit())
                                }
                            />
                        ))}
                    </Scroll>
                </>
            )}

            {form.values.step === 'passkey' && (
                <>
                    <div className="flex flex-nowrap items-center">
                        <ItemIcon
                            url={domain}
                            icon="pass-passkey"
                            size={5}
                            alt=""
                            className="shrink-0"
                            loadImage={settings.loadDomainImages}
                        />
                        <div className="flex-auto">
                            <Field
                                lengthLimiters
                                name="name"
                                component={TitleField}
                                spellCheck={false}
                                autoComplete={'off'}
                                placeholder={c('Placeholder').t`Untitled`}
                                maxLength={MAX_ITEM_NAME_LENGTH}
                                className="pr-0"
                                dense
                            />
                        </div>
                    </div>

                    <FieldsetCluster mode="read" as="div">
                        <ValueControl icon={'user'} label={c('Label').t`Username`} value={username} />
                        <ValueControl icon={'earth'} label={c('Label').t`Website`} value={domain} />
                    </FieldsetCluster>

                    <div className="px-2 py-1 text-xs color-weak">{c('Info')
                        .t`A passkey for "${username}" will be saved and available on devices where ${PASS_APP_NAME} is installed.`}</div>
                </>
            )}

            <div className="shrink-0 flex justify-space-between">
                <Button
                    pill
                    color="norm"
                    type="submit"
                    className="flex-auto"
                    form={formId}
                    loading={loading}
                    disabled={loading}
                >
                    <span className="text-ellipsis">
                        {(() => {
                            if (loading) return c('Action').t`Saving passkey...`;
                            if (form.values.step === 'select') return c('Action').t`Create new login`;
                            if (form.values.step === 'passkey') return c('Action').t`Save passkey`;
                        })()}
                    </span>
                </Button>
            </div>
        </>
    ) : null;
};

type Props = Extract<NotificationActions, { action: NotificationAction.PASSKEY_CREATE }>;

export const PasskeyCreate: FC<Props> = ({ domain, request, token }) => {
    const [loading, setLoading] = useMountedState(false);
    const { onTelemetry, config } = usePassCore();
    const { close, postMessage } = useIFrameContext();
    const { createNotification } = useNotifications();

    const publicKey = useMemo(() => JSON.parse(request) as SanitizedPublicKeyCreate, [request]);
    const username = publicKey.user.name;

    const form = useFormik<FormValues>({
        initialValues: { name: domain, step: 'select' },
        validate: (values) => {
            const errors: FormikErrors<FormValues> = { name: validateItemName(values.name) };
            if (!errors.name) delete errors.name;
            return errors;
        },
        onSubmit: async ({ name, step, selectedItem, shareId }, { setFieldValue }) => {
            try {
                if (step === 'select' && !selectedItem) return await setFieldValue('step', 'passkey');
                else setLoading(true);

                const result = await sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.PASSKEY_CREATE,
                        payload: { request, domain },
                    })
                );

                if (result.type !== 'success') throw new Error(result.error);

                const response = await (async () => {
                    if (!result.intercept) {
                        return createBridgeResponse<WorkerMessageType.PASSKEY_CREATE>(
                            { type: 'success', intercept: false },
                            token
                        );
                    }

                    const { response } = result;
                    const passkey = sanitizePasskey(response, config);
                    const base = {
                        type: AutosaveMode.UPDATE,
                        name,
                        userIdentifier: username,
                        password: '',
                        domain,
                        passkey,
                    };

                    await sendMessage.on(
                        contentScriptMessage({
                            type: WorkerMessageType.AUTOSAVE_REQUEST,
                            payload: selectedItem
                                ? { ...base, ...selectedItem, type: AutosaveMode.UPDATE }
                                : { ...base, shareId: shareId!, type: AutosaveMode.NEW },
                        }),
                        (res) => res.type === 'error' && throwError({ message: res.error })
                    );

                    return createBridgeResponse<WorkerMessageType.PASSKEY_CREATE>(
                        { type: 'success', response, intercept: true },
                        token
                    );
                })();

                postMessage(response);
                onTelemetry(TelemetryEventName.PasskeyCreated, {}, {});
                close();
            } catch (err) {
                const message = getErrorMessage(err);
                createNotification({
                    type: 'error',
                    // translator: Shown with error message on passkey registration failure
                    text: c('Error').t`Registration failure: ${message}`,
                });
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <div className="ui-violet flex flex-column flex-nowrap justify-space-between h-full gap-2 anime-fade-in">
            <FormikProvider value={form}>
                <Form id={formId} className="max-w-full overflow-hidden flex flex-auto flex-column flex-nowrap gap-2">
                    <NotificationHeader
                        title={(() => {
                            switch (form.values.step) {
                                case 'passkey':
                                    return (
                                        <Field
                                            component={AutosaveVaultPicker}
                                            fallback={c('Info').t`Save passkey`}
                                            name="shareId"
                                        />
                                    );
                                case 'select':
                                    return c('Info').t`Save passkey`;
                            }
                        })()}
                        onClose={() =>
                            postMessage(
                                createBridgeResponse<WorkerMessageType.PASSKEY_CREATE>(
                                    { type: 'success', intercept: false },
                                    token
                                )
                            )
                        }
                    />

                    <div className="max-w-full overflow-hidden flex flex-auto flex-column flex-nowrap gap-2">
                        <WithPinUnlock>
                            {(locked, input) =>
                                locked ? (
                                    <div className="max-w-full overflow-hidden flex flex-auto flex-column flex-nowrap gap-2">
                                        <div className="shrink-0 px-1">{`${c('Label').t`Passkey`} • ${domain}`}</div>

                                        <Card className="flex flex-auto text-sm" type="primary">
                                            <div className="flex flex-column justify-center items-center gap-2 mb-2">
                                                <Icon name="lock-filled" size={6} />
                                                <span className="text-center block">
                                                    {c('Info')
                                                        .t`Unlock ${PASS_APP_NAME} with your PIN code to save this passkey`}
                                                </span>
                                            </div>
                                            {input}
                                        </Card>

                                        <div className="shrink-0 p-1 text-xs color-weak">{c('Info')
                                            .t`Close this window in order to use another passkey manager.`}</div>
                                    </div>
                                ) : (
                                    <PasskeyCreateView
                                        domain={domain}
                                        form={form}
                                        loading={loading}
                                        username={username}
                                    />
                                )
                            }
                        </WithPinUnlock>
                    </div>
                </Form>
            </FormikProvider>
        </div>
    );
};
