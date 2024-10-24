import { type FC, useEffect } from 'react';

import type { FormikErrors } from 'formik';
import { Field, Form, FormikProvider, useFormik } from 'formik';
import {
    MIN_DROPDOWN_HEIGHT,
    NOTIFICATION_HEIGHT_XS,
    NOTIFICATION_WIDTH,
} from 'proton-pass-extension/app/content/constants.static';
import { AutosaveVaultPicker } from 'proton-pass-extension/app/content/injections/apps/components/AutosaveVaultPicker';
import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { AutosaveForm } from 'proton-pass-extension/app/content/injections/apps/notification/components/AutosaveForm';
import { AutosaveSelect } from 'proton-pass-extension/app/content/injections/apps/notification/components/AutosaveSelect';
import { NotificationHeader } from 'proton-pass-extension/app/content/injections/apps/notification/components/NotificationHeader';
import type { NotificationAction, NotificationActions } from 'proton-pass-extension/app/content/types/notification';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import usePrevious from '@proton/hooks/usePrevious';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { validateItemName } from '@proton/pass/lib/validation/item';
import {
    type AutosaveCreatePayload,
    type AutosaveFormValues,
    AutosaveMode,
    type AutosavePayload,
    type AutosaveUpdatePayload,
    WorkerMessageType,
} from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { withMerge } from '@proton/pass/utils/object/merge';
import noop from '@proton/utils/noop';

type Props = Extract<NotificationActions, { action: NotificationAction.AUTOSAVE }>;

const getInitialValues = ({ userIdentifier, password, type }: AutosavePayload, domain: string): AutosaveFormValues =>
    type === AutosaveMode.UPDATE
        ? { itemId: '', name: domain, password, shareId: '', step: 'select', type, userIdentifier }
        : { name: domain, password, shareId: '', step: 'edit', type, userIdentifier };

export const Autosave: FC<Props> = ({ data }) => {
    const { visible, close, domain, resize } = useIFrameContext();
    const { onTelemetry } = usePassCore();
    const { createNotification } = useNotifications();

    const [busy, setBusy] = useMountedState(false);
    const shouldUpdate = usePrevious(data) !== data;

    /** if the autosave prompt was shown before an actual form
     * submission : do not discard the form data */
    const shouldDiscard = data.submittedAt !== null;

    const form = useFormik<AutosaveFormValues>({
        initialValues: getInitialValues(data, domain),
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
        if (shouldUpdate) {
            form.setValues({ ...getInitialValues(data, domain), shareId: form.values.shareId }).catch(noop);
        }
    }, [shouldUpdate, data]);

    useEffect(() => {
        if (form.values.step === 'edit') return resize(NOTIFICATION_WIDTH);

        // Max we accept is 3
        if (form.values.type === AutosaveMode.UPDATE) {
            const candidates = data.type === AutosaveMode.UPDATE ? data.candidates.length : 0;
            if (candidates > 3) return resize(NOTIFICATION_WIDTH);
            if (candidates === 1) return resize(NOTIFICATION_HEIGHT_XS + MIN_DROPDOWN_HEIGHT * candidates + 10);
            resize(NOTIFICATION_HEIGHT_XS + MIN_DROPDOWN_HEIGHT * candidates);
        }
    }, [data, form]);

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
                {form.values.step === 'select' && (
                    <AutosaveSelect data={data as AutosaveUpdatePayload} busy={busy} form={form} />
                )}
                {form.values.step === 'edit' && (
                    <AutosaveForm data={data as AutosaveCreatePayload} busy={busy} form={form} />
                )}
            </Form>
        </FormikProvider>
    );
};
