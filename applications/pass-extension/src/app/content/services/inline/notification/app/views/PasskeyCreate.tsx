import { type FC, useEffect, useMemo, useRef } from 'react';

import type { FormikContextType, FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { createBridgeResponse } from 'proton-pass-extension/app/content/bridge/message';
import type { BridgeResponse } from 'proton-pass-extension/app/content/bridge/types';
import type { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { NotificationHeader } from 'proton-pass-extension/app/content/services/inline/notification/app/components/NotificationHeader';
import type { NotificationRequest } from 'proton-pass-extension/app/content/services/inline/notification/notification.app';
import { AutosaveVaultPicker } from 'proton-pass-extension/lib/components/Inline/AutosaveVaultPicker';
import { useIFrameAppController, useIFrameAppState } from 'proton-pass-extension/lib/components/Inline/IFrameApp';
import { ListItem } from 'proton-pass-extension/lib/components/Inline/ListItem';
import { WithPinUnlock } from 'proton-pass-extension/lib/components/Inline/PinUnlock';
import { ScrollableItemsList } from 'proton-pass-extension/lib/components/Inline/ScrollableItemsList';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import type { SanitizedPublicKeyCreate } from '@proton/pass/lib/passkeys/types';
import { sanitizePasskey } from '@proton/pass/lib/passkeys/utils';
import { validateItemName } from '@proton/pass/lib/validation/item';
import type { SelectedItem } from '@proton/pass/types/data/items';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { AutosaveMode } from '@proton/pass/types/worker/autosave';
import type { LoginItemPreview } from '@proton/pass/types/worker/data';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { throwError } from '@proton/pass/utils/fp/throw';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Step = 'select' | 'passkey';
type FormValues = { name: string; step: Step; selectedItem?: SelectedItem; shareId?: string };
const formId = 'create-passkey';

type PasskeyCreateViewProps = {
    form: FormikContextType<FormValues>;
    loading: boolean;
    username: string;
};

const PasskeyCreateView: FC<PasskeyCreateViewProps> = ({ form, loading, username }) => {
    const { onTelemetry } = usePassCore();
    const { settings, domain } = useIFrameAppState();
    const controller = useIFrameAppController();
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
            await form.setFieldValue('step', candidates.length > 0 ? 'select' : 'passkey');
            setItems(candidates);
            onTelemetry(TelemetryEventName.PasskeyCreateDisplay, {}, {});
        };

        run().catch(controller.close);
    }, []);

    return items ? (
        <>
            {form.values.step === 'select' && (
                <>
                    <div className="px-2">
                        {`${c('Label').t`Passkey`} • ${domain}`}
                        <span className="block text-xs color-weak">{c('Info')
                            .t`Select an existing login or create a new one.`}</span>
                    </div>

                    <ScrollableItemsList increaseSurface>
                        {items.map(({ itemId, shareId, url, userIdentifier, name }) => (
                            <ListItem
                                key={`${shareId}-${itemId}`}
                                className="rounded-none"
                                title={name}
                                subTitle={userIdentifier}
                                icon={{ type: 'icon', url, icon: 'pass-passkey' }}
                                onClick={() =>
                                    form
                                        .setValues({ selectedItem: { itemId, shareId }, step: 'select', name })
                                        .then(() => form.handleSubmit())
                                }
                            />
                        ))}
                    </ScrollableItemsList>
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

            <div className="flex justify-space-between">
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

type Props = Extract<NotificationRequest, { action: NotificationAction.PASSKEY_CREATE }>;

export const PasskeyCreate: FC<Props> = ({ request, token, domain: passkeyDomain }) => {
    const [loading, setLoading] = useMountedState(false);
    const { onTelemetry, config } = usePassCore();
    const { domain } = useIFrameAppState();
    const controller = useIFrameAppController();
    const { createNotification } = useNotifications();

    const publicKey = useMemo(() => JSON.parse(request) as SanitizedPublicKeyCreate, [request]);
    /** "name" properties may be missing for some relying parties (see globals.d.ts) */
    const username = publicKey.user?.name ?? publicKey.user?.displayName ?? '';

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
                        payload: { request, domain: passkeyDomain },
                    })
                );

                if (result.type !== 'success') throw new Error(result.error);

                const payload = await (async (): Promise<BridgeResponse<WorkerMessageType.PASSKEY_CREATE>> => {
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

                controller.forwardMessage({ type: InlinePortMessageType.PASSKEY_RELAY, payload });

                onTelemetry(TelemetryEventName.PasskeyCreated, {}, {});
                controller.close();
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

    const vaultPickerAnchor = useRef<HTMLDivElement>(null);

    return (
        <div className="ui-violet flex flex-column flex-nowrap justify-space-between h-full gap-2 anime-fade-in">
            <FormikProvider value={form}>
                <Form id={formId} className="max-w-full flex flex-auto flex-column flex-nowrap *:shrink-0 gap-2">
                    <NotificationHeader
                        ref={vaultPickerAnchor}
                        title={(() => {
                            switch (form.values.step) {
                                case 'passkey':
                                    return (
                                        <Field
                                            name="shareId"
                                            component={AutosaveVaultPicker}
                                            fallback={c('Info').t`Save passkey`}
                                            anchorRef={vaultPickerAnchor}
                                        />
                                    );
                                case 'select':
                                    return c('Info').t`Save passkey`;
                            }
                        })()}
                        onClose={() =>
                            controller.forwardMessage({
                                type: InlinePortMessageType.PASSKEY_RELAY,
                                payload: createBridgeResponse<WorkerMessageType.PASSKEY_CREATE>(
                                    { type: 'success', intercept: false },
                                    token
                                ),
                            })
                        }
                    />

                    <div className="max-w-full flex flex-auto flex-column flex-nowrap gap-2">
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

                                        <div className="shrink-0 px-1 text-xs color-weak">{c('Info')
                                            .t`Close this window in order to use another passkey manager.`}</div>
                                    </div>
                                ) : (
                                    <PasskeyCreateView form={form} loading={loading} username={username} />
                                )
                            }
                        </WithPinUnlock>
                    </div>
                </Form>
            </FormikProvider>
        </div>
    );
};
