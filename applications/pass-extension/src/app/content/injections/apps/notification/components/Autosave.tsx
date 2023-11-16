import { type VFC, useEffect, useState } from 'react';

import type { FormikErrors } from 'formik';
import { Field, Form, FormikProvider, useFormik } from 'formik';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/common/PauseListDropdown';
import type { IFrameCloseOptions } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useNotifications } from '@proton/components/hooks';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { BaseItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { validateItemName } from '@proton/pass/lib/validation/item';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { Item } from '@proton/pass/types';
import { AutoSaveType, type FormEntryPrompt, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { isValidURL } from '@proton/pass/utils/url/is-valid-url';
import noop from '@proton/utils/noop';

import { NotificationHeader } from './NotificationHeader';

import './Autosave.scss';

type Props = {
    settings: ProxiedSettings;
    submission: FormEntryPrompt;
    visible?: boolean;
    onClose?: (options?: IFrameCloseOptions) => void;
};
type AutosaveFormValues = { name: string; username: string; password: string };

export const Autosave: VFC<Props> = ({ settings, submission, visible, onClose }) => {
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
                              username: obfuscate(username),
                              password: obfuscate(password),
                              urls: Array.from(
                                  new Set(submission.autosave.data.item.data.content.urls.concat(valid ? [url] : []))
                              ),
                          },
                      })
                    : {
                          type: 'login',
                          metadata: {
                              name,
                              // translator: full sentence is: Autosaved on account.proton.me
                              note: obfuscate(c('Info').t`Autosaved on ${submissionURL}`),
                              itemUuid: uniqueId(),
                          },
                          content: {
                              username: obfuscate(username),
                              password: obfuscate(password),
                              urls: valid ? [url] : [],
                              totpUri: obfuscate(''),
                          },
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
            <Form className="ui-violet flex flex-column flex-nowrap flex-justify-space-between h-full">
                <NotificationHeader
                    title={(() => {
                        switch (submission.autosave.data.action) {
                            case AutoSaveType.NEW:
                                return c('Info').t`Save login`;
                            case AutoSaveType.UPDATE:
                                return c('Info').t`Update login`;
                        }
                    })()}
                    extra={
                        <PauseListDropdown
                            criteria="Autosave"
                            hostname={submission.subdomain ?? submission.domain}
                            label={c('Action').t`Disable autosave on this website`}
                            onClose={onClose}
                            visible={visible}
                        />
                    }
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
