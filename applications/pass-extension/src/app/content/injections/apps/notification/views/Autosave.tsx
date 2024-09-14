import { type FC, useEffect } from 'react';

import type { FormikErrors } from 'formik';
import { Field, Form, FormikProvider, useFormik } from 'formik';
import { AutosaveVaultPicker } from 'proton-pass-extension/app/content/injections/apps/components/AutosaveVaultPicker';
import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { NotificationHeader } from 'proton-pass-extension/app/content/injections/apps/notification/components/NotificationHeader';
import { c } from 'ttag';

import { Button, Scroll } from '@proton/atoms';
import { useNotifications } from '@proton/components/hooks';
import usePrevious from '@proton/hooks/usePrevious';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { validateItemName } from '@proton/pass/lib/validation/item';
import type { AutosavePayload, AutosaveRequest } from '@proton/pass/types';
import { AutosaveMode, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { withMerge } from '@proton/pass/utils/object/merge';
import noop from '@proton/utils/noop';

type Props = { data: AutosavePayload };
type AutosaveFormValues = AutosaveRequest & { step: 'select' | 'edit' };

const getInitialValues = ({ userIdentifier, password, domain, type }: AutosavePayload): AutosaveFormValues =>
    type === AutosaveMode.UPDATE
        ? { domain, itemId: '', name: domain, password, shareId: '', step: 'select', type, userIdentifier }
        : { domain, name: domain, password, shareId: '', step: 'edit', type, userIdentifier };

export const Autosave: FC<Props> = ({ data }) => {
    const { settings, visible, close } = useIFrameContext();
    const { onTelemetry } = usePassCore();
    const { createNotification } = useNotifications();

    const [busy, setBusy] = useMountedState(false);
    const shouldUpdate = usePrevious(data) !== data;
    const { domain } = data;

    /** if the autosave prompt was shown before an actual form
     * submission : do not discard the form data */
    const shouldDiscard = data.submittedAt !== null;

    const form = useFormik<AutosaveFormValues>({
        initialValues: getInitialValues(data),
        validateOnChange: true,
        validate: (values) => {
            const errors: FormikErrors<AutosaveFormValues> = {};

            if (values.step === 'select') return errors;

            switch (values.type) {
                case AutosaveMode.UPDATE: {
                    const { itemId, shareId } = values;
                    if (!(itemId && shareId)) errors.type = 'Invalid update request';
                    break;
                }
                case AutosaveMode.NEW: {
                    const { shareId } = values;
                    if (!shareId) errors.type = 'Invalid create request';
                }
            }

            const nameError = validateItemName(values.name);
            if (nameError) errors.name = nameError;

            return errors;
        },

        onSubmit: async (values, { setValues }) => {
            if (values.step === 'select') {
                return setValues(
                    withMerge<AutosaveFormValues>({
                        step: 'edit',
                        type: AutosaveMode.NEW,
                    })
                );
            }

            setBusy(true);

            return sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: values,
                })
            )
                .then((result) => {
                    if (result.type === 'success') {
                        onTelemetry(TelemetryEventName.AutosaveDone, {}, {});
                        close?.({ discard: true });
                    } else createNotification({ text: c('Warning').t`Unable to save`, type: 'error' });
                })
                .catch(noop)
                .finally(() => setBusy(false));
        },
    });

    useTelemetryEvent(TelemetryEventName.AutosaveDisplay, {}, {})([visible]);

    useEffect(() => {
        if (shouldUpdate) form.setValues(getInitialValues(data)).catch(noop);
    }, [shouldUpdate, data]);

    return (
        <FormikProvider value={form}>
            <Form className="ui-violet flex flex-column flex-nowrap justify-space-between h-full anime-fadein gap-2">
                <NotificationHeader
                    discardOnClose={shouldDiscard}
                    title={(() => {
                        switch (form.values.type) {
                            case AutosaveMode.NEW:
                                return (
                                    <Field
                                        name="shareId"
                                        component={AutosaveVaultPicker}
                                        fallback={c('Info').t`Save login`}
                                    />
                                );
                            case AutosaveMode.UPDATE:
                                return c('Info').t`Update login`;
                        }
                    })()}
                    extra={
                        <PauseListDropdown
                            criteria="Autosave"
                            hostname={domain}
                            label={c('Action').t`Disable autosave on this website`}
                        />
                    }
                />

                {form.values.step === 'select' && data.type === AutosaveMode.UPDATE && (
                    <>
                        <div className="shrink-0 px-1">
                            {`${c('Label').t`Login`} • ${domain}`}
                            <span className="block text-xs color-weak">{c('Info')
                                .t`Select an existing login item to update.`}</span>
                        </div>

                        <Scroll>
                            {data.candidates.map(({ itemId, shareId, url, userIdentifier, name }) => (
                                <ListItem
                                    key={`${shareId}-${itemId}`}
                                    className="rounded-xl"
                                    icon="user"
                                    title={name}
                                    subTitle={userIdentifier}
                                    url={url}
                                    onClick={() =>
                                        form.setValues((values) => ({
                                            ...values,
                                            type: AutosaveMode.UPDATE,
                                            step: 'edit',
                                            itemId,
                                            shareId,
                                            name: name || values.name,
                                            userIdentifier: userIdentifier || values.userIdentifier,
                                        }))
                                    }
                                />
                            ))}
                        </Scroll>
                    </>
                )}

                {form.values.step === 'edit' && (
                    <div>
                        <div className="flex flex-nowrap items-center mb-2">
                            <ItemIcon
                                url={domain}
                                icon={'user'}
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

                        <FieldsetCluster>
                            <Field name="userIdentifier" component={TextField} label={c('Label').t`Username/email`} />
                            <Field hidden name="password" component={TextField} label={c('Label').t`Password`} />
                        </FieldsetCluster>
                    </div>
                )}

                <div className="flex justify-space-between shrink-0 gap-3 mt-1">
                    <Button pill color="norm" shape="outline" onClick={() => close({ discard: shouldDiscard })}>{c(
                        'Action'
                    ).t`Not now`}</Button>
                    <Button pill color="norm" type="submit" loading={busy} disabled={busy} className="flex-auto">
                        <span className="text-ellipsis">
                            {(() => {
                                const { step, type } = form.values;
                                if (step === 'select') return c('Action').t`Create new login`;
                                if (type === AutosaveMode.NEW) return busy ? c('Action').t`Saving` : c('Action').t`Add`;
                                return busy ? c('Action').t`Updating` : c('Action').t`Update`;
                            })()}
                        </span>
                    </Button>
                </div>
            </Form>
        </FormikProvider>
    );
};
