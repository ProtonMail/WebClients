import { type VFC, useEffect, useState } from 'react';

import type { FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useNotifications } from '@proton/components/hooks';
import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { Item } from '@proton/pass/types';
import { AutoSaveType, type FormEntryPrompt, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { partialMerge } from '@proton/pass/utils/object';
import { uniqueId } from '@proton/pass/utils/string';
import { isValidURL } from '@proton/pass/utils/url';
import noop from '@proton/utils/noop';

import { Field } from '../../../../../popup/components/Field/Field';
import { FieldsetCluster } from '../../../../../popup/components/Field/Layout/FieldsetCluster';
import { TextField } from '../../../../../popup/components/Field/TextField';
import { TitleField } from '../../../../../popup/components/Field/TitleField';
import { BaseItemIcon } from '../../../../../shared/components/icon/ItemIcon';
import { MAX_ITEM_NAME_LENGTH, validateItemName } from '../../../../../shared/form/validator/validate-item';
import type { IFrameCloseOptions } from '../../../../types';
import { NotificationHeader } from './NotificationHeader';

import './Autosave.scss';

type Props = {
    visible?: boolean;
    submission: FormEntryPrompt;
    onClose?: (options?: IFrameCloseOptions) => void;
    settings: ProxiedSettings;
};
type AutosaveFormValues = { name: string; username: string; password: string };

export const Autosave: VFC<Props> = ({ visible, submission, settings, onClose }) => {
    const { createNotification } = useNotifications();
    const [busy, setBusy] = useState(false);
    const submissionURL = submission.subdomain ?? submission.domain;

    useEffect(() => {
        if (visible) {
            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.TELEMETRY_EVENT,
                    payload: {
                        event: createTelemetryEvent(TelemetryEventName.AutosaveDisplay, {}, {}),
                    },
                })
            );
        }
    }, [visible]);

    const form = useFormik<AutosaveFormValues>({
        initialValues: {
            name:
                submission.autosave.data.action === AutoSaveType.UPDATE
                    ? submission.autosave.data.item.data.metadata.name
                    : submissionURL,
            username: submission.data.username,
            password: submission.data.password,
        },
        validateOnChange: true,
        validate: (values) => {
            const errors: FormikErrors<AutosaveFormValues> = {};

            const nameError = validateItemName(values.name);
            if (nameError) errors.name = nameError;

            return errors;
        },

        onSubmit: async ({ name, username, password }) => {
            setBusy(true);

            const { valid, url } = isValidURL(submissionURL);

            const item: Item<'login'> =
                submission.autosave.data.action === AutoSaveType.UPDATE
                    ? partialMerge(submission.autosave.data.item.data, {
                          metadata: { name },
                          content: {
                              username,
                              password,
                              urls: Array.from(
                                  new Set(submission.autosave.data.item.data.content.urls.concat(valid ? [url] : []))
                              ),
                          },
                      })
                    : {
                          type: 'login',
                          metadata: {
                              name,
                              note: c('Info').t`Autosaved on ${submissionURL}`,
                              itemUuid: uniqueId(),
                          },
                          content: { username, password, urls: valid ? [url] : [], totpUri: '' },
                          extraFields: [],
                      };

            try {
                const result = await sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.AUTOSAVE_REQUEST,
                        payload: { submission, item },
                    })
                );

                if (result.type === 'success') {
                    sendMessage(
                        contentScriptMessage({
                            type: WorkerMessageType.TELEMETRY_EVENT,
                            payload: {
                                event: createTelemetryEvent(TelemetryEventName.AutosaveDone, {}, {}),
                            },
                        })
                    ).catch(noop);

                    return onClose?.({ discard: true });
                }

                return createNotification({ text: c('Warning').t`Unable to save`, type: 'error' });
            } catch (_) {
            } finally {
                setBusy(false);
            }
        },
    });

    return (
        <FormikProvider value={form}>
            <Form className="ui-violet flex flex-column h100 flex-justify-space-between">
                <NotificationHeader
                    title={(() => {
                        switch (submission.autosave.data.action) {
                            case AutoSaveType.NEW:
                                return c('Info').t`Save login`;
                            case AutoSaveType.UPDATE:
                                return c('Info').t`Update login`;
                        }
                    })()}
                    onClose={onClose}
                />
                <div>
                    <div className="flex flex-nowrap flex-align-items-center mb-2">
                        <BaseItemIcon
                            url={submission.domain}
                            icon={'user'}
                            size={20}
                            alt=""
                            className="flex-item-noshrink"
                            loadImage={settings.loadDomainImages}
                        />
                        <div className="flex-item-fluid-auto">
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
                <div className="flex flex-justify-space-between gap-3">
                    <Button pill color="norm" shape="outline" onClick={() => onClose?.({ discard: true })}>{c('Action')
                        .t`Not now`}</Button>
                    <Button
                        pill
                        color="norm"
                        type="submit"
                        loading={busy}
                        disabled={busy}
                        className="flex-item-fluid-auto"
                    >
                        {(() => {
                            switch (submission.autosave.data.action) {
                                case AutoSaveType.NEW:
                                    return busy ? c('Action').t`Saving` : c('Action').t`Add`;
                                case AutoSaveType.UPDATE:
                                    return busy ? c('Action').t`Updating` : c('Action').t`Update`;
                            }
                        })()}
                    </Button>
                </div>
            </Form>
        </FormikProvider>
    );
};
