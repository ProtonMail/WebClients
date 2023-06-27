import { type VFC, useState } from 'react';

import { Field, Form, FormikProvider, useFormik } from 'formik';
import type { FieldProps } from 'formik/dist/Field';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, InputFieldTwo, PasswordInputTwo } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { Item } from '@proton/pass/types';
import { AutoSaveType, type PromptedFormEntry, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { partialMerge } from '@proton/pass/utils/object';
import { uniqueId } from '@proton/pass/utils/string';
import { isValidURL } from '@proton/pass/utils/url';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useIFrameContext } from '../../context/IFrameContextProvider';

import './Autosave.scss';

type AutosaveFormValues = {
    title: string;
    username: string;
    password: string;
};

export const Autosave: VFC<{ submission: PromptedFormEntry; onAutoSaved?: () => void }> = ({
    submission,
    onAutoSaved,
}) => {
    const { closeIFrame } = useIFrameContext();
    const { createNotification } = useNotifications();
    const [busy, setBusy] = useState(false);
    const submissionURL = submission.subdomain ?? submission.domain;

    const form = useFormik<AutosaveFormValues>({
        initialValues: {
            title:
                submission.autosave.data.action === AutoSaveType.UPDATE
                    ? submission.autosave.data.item.data.metadata.name
                    : submissionURL,
            username: submission.data.username,
            password: submission.data.password,
        },
        validateOnChange: true,

        onSubmit: async ({ title, username, password }) => {
            setBusy(true);

            const { valid, url } = isValidURL(submissionURL);

            const item: Item<'login'> =
                submission.autosave.data.action === AutoSaveType.UPDATE
                    ? partialMerge(submission.autosave.data.item.data, {
                          metadata: { name: title },
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
                              name: title,
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

                    return onAutoSaved?.();
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
            <Form className="flex flex-column h100">
                <div className="flex flex-nowrap flex-item-noshrink flex-align-items-start flex-justify-space-between">
                    <div className="mt-1">
                        <h3 className="text-bold text-2xl">
                            {submission.autosave.data.action === AutoSaveType.NEW &&
                                c('Info').t`Add to ${PASS_APP_NAME}`}
                            {submission.autosave.data.action === AutoSaveType.UPDATE && c('Info').t`Update credentials`}
                        </h3>
                    </div>
                    <div className="modal-two-header-actions flex flex-item-noshrink flex-nowrap flex-align-items-stretch">
                        <Button className="flex-item-noshrink" shape="ghost" icon onClick={closeIFrame}>
                            <Icon name="cross-big" />
                        </Button>
                    </div>
                </div>
                <div className="flex-item-fluid">
                    <div className="flex flex-align-items-center mt-5 mb-4">
                        <Icon name={'key'} className="mr-2 item-icon" color="#6D4AFF" />
                        <Field name="title">
                            {({ field }: FieldProps<AutosaveFormValues['title'], AutosaveFormValues>) => (
                                <input
                                    className="item-name--input text-xl text-bold flex-item-fluid"
                                    spellCheck={false}
                                    autoComplete={'off'}
                                    {...field}
                                />
                            )}
                        </Field>
                    </div>

                    <Field name="username">
                        {({ field }: FieldProps<AutosaveFormValues['username'], AutosaveFormValues>) => (
                            <InputFieldTwo dense label="Username" className="mb-2" {...field} />
                        )}
                    </Field>

                    <Field name="password">
                        {({ field }: FieldProps<AutosaveFormValues['password'], AutosaveFormValues>) => (
                            <InputFieldTwo dense as={PasswordInputTwo} label="Password" {...field} />
                        )}
                    </Field>
                </div>
                <div className="flex flex-justify-space-between">
                    <Button onClick={closeIFrame}>{c('Action').t`Not now`}</Button>
                    <Button color="norm" type="submit" loading={busy} disabled={busy}>
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
