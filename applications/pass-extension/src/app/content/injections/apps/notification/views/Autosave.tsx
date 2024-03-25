import { type FC, useEffect, useState } from 'react';

import type { FormikErrors } from 'formik';
import { Field, Form, FormikProvider, useFormik } from 'formik';
import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { NotificationHeader } from 'proton-pass-extension/app/content/injections/apps/notification/components/NotificationHeader';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useNotifications } from '@proton/components/hooks';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { useEnsureMounted } from '@proton/pass/hooks/useEnsureMounted';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { validateItemName } from '@proton/pass/lib/validation/item';
import { AutosaveType, type FormEntryPrompt, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import noop from '@proton/utils/noop';

type Props = { submission: FormEntryPrompt };
type AutosaveValues = { name: string; username: string; password: string };

export const Autosave: FC<Props> = ({ submission }) => {
    const { settings, visible, close } = useIFrameContext();
    const { onTelemetry } = usePassCore();
    const { createNotification } = useNotifications();
    const ensureMounted = useEnsureMounted();

    const [busy, setBusy] = useState(false);
    const { data } = submission.autosave;
    const domain = submission.subdomain ?? submission.domain;

    const form = useFormik<AutosaveValues>({
        initialValues: {
            name: data.type === AutosaveType.UPDATE ? data.name : domain,
            username: submission.data.username,
            password: submission.data.password,
        },
        validateOnChange: true,
        validate: (values) => {
            const errors: FormikErrors<AutosaveValues> = { name: validateItemName(values.name) };
            if (!errors.name) delete errors.name;
            return errors;
        },

        onSubmit: async (values) => {
            setBusy(true);

            return sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOSAVE_REQUEST,
                    payload: { ...data, ...values, domain },
                })
            )
                .then((result) => {
                    if (result.type === 'success') {
                        onTelemetry(createTelemetryEvent(TelemetryEventName.AutosaveDone, {}, {}));
                        close?.({ discard: true });
                    } else createNotification({ text: c('Warning').t`Unable to save`, type: 'error' });
                })
                .catch(noop)
                .finally(ensureMounted(() => setBusy(false)));
        },
    });

    useEffect(() => {
        if (visible) onTelemetry(createTelemetryEvent(TelemetryEventName.AutosaveDisplay, {}, {}));
    }, [visible]);

    return (
        <FormikProvider value={form}>
            <Form className="ui-violet flex flex-column flex-nowrap justify-space-between h-full anime-fadein">
                <NotificationHeader
                    title={(() => {
                        switch (submission.autosave.data.type) {
                            case AutosaveType.NEW:
                                return c('Info').t`Save login`;
                            case AutosaveType.UPDATE:
                                return c('Info').t`Update login`;
                        }
                    })()}
                    extra={
                        <PauseListDropdown
                            criteria="Autosave"
                            hostname={submission.subdomain ?? submission.domain}
                            label={c('Action').t`Disable autosave on this website`}
                        />
                    }
                />
                <div>
                    <div className="flex flex-nowrap items-center mb-2">
                        <ItemIcon
                            url={submission.domain}
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
                        <Field name="username" component={TextField} label={c('Label').t`Username`} />
                        <Field hidden name="password" component={TextField} label={c('Label').t`Password`} />
                    </FieldsetCluster>
                </div>
                <div className="flex justify-space-between gap-3">
                    <Button pill color="norm" shape="outline" onClick={() => close({ discard: true })}>{c('Action')
                        .t`Not now`}</Button>
                    <Button pill color="norm" type="submit" loading={busy} disabled={busy} className="flex-auto">
                        <span className="text-ellipsis">
                            {(() => {
                                switch (data.type) {
                                    case AutosaveType.NEW:
                                        return busy ? c('Action').t`Saving` : c('Action').t`Add`;
                                    case AutosaveType.UPDATE:
                                        return busy ? c('Action').t`Updating` : c('Action').t`Update`;
                                }
                            })()}
                        </span>
                    </Button>
                </div>
            </Form>
        </FormikProvider>
    );
};
