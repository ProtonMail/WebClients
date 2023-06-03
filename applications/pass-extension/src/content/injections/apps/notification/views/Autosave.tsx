import { type VFC, useState } from 'react';

import { Field, Form, FormikProvider, useFormik } from 'formik';
import type { FieldProps } from 'formik/dist/Field';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, InputFieldTwo, PasswordInputTwo } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { AutoSaveType, type PromptedFormEntry, WorkerMessageType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string';
import { isValidURL } from '@proton/pass/utils/url';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useIFrameContext } from '../../context/IFrameContextProvider';

import './Autosave.scss';

type AutosaveFormValues = {
    title: string;
    username: string;
    password: string;
};

export const Autosave: VFC<{ submission: PromptedFormEntry; onAutoSaved: () => void }> = ({
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
            const revision =
                submission.autosave.data.action === AutoSaveType.UPDATE
                    ? {
                          note: submission.autosave.data.item.data.metadata.note,
                          urls: Array.from(
                              new Set(submission.autosave.data.item.data.content.urls.concat(valid ? [url] : []))
                          ),
                      }
                    : {
                          note: c('Info').t`Autosaved on ${submissionURL}`,
                          urls: valid ? [url] : [],
                      };

            try {
                const result = await sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.AUTOSAVE_REQUEST,
                        payload: {
                            submission,
                            item: {
                                type: 'login',
                                metadata: { name: title, note: revision.note, itemUuid: uniqueId() },
                                content: { username, password, urls: revision.urls, totpUri: '' },
                                extraFields: [],
                            },
                        },
                    })
                );

                return result.type === 'success'
                    ? onAutoSaved()
                    : createNotification({
                          text: c('Warning').t`Unable to save`,
                          type: 'error',
                      });
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
