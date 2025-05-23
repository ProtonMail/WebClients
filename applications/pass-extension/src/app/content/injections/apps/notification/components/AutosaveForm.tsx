import { type FC } from 'react';

import { Field, type FormikContextType } from 'formik';
import {
    useIFrameAppController,
    useIFrameAppState,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { MAX_ITEM_NAME_LENGTH, MODEL_VERSION } from '@proton/pass/constants';
import type { AutosavePayload } from '@proton/pass/types';
import { type AutosaveFormValues, AutosaveMode } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

type Props = {
    busy: boolean;
    data: AutosavePayload;
    form: FormikContextType<AutosaveFormValues>;
};

export const AutosaveForm: FC<Props> = ({ data, busy, form }) => {
    const { onTelemetry } = usePassCore();
    const { settings, domain } = useIFrameAppState();
    const controller = useIFrameAppController();

    /** if the autosave prompt was shown before an actual form
     * submission : do not discard the form data */
    const shouldDiscard = data.submittedAt !== null;

    return (
        <>
            <div className="flex flex-nowrap items-center">
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
                <Field
                    name="userIdentifier"
                    component={TextField}
                    className="shrink-0"
                    label={c('Label').t`Username/email`}
                />
                <Field
                    hidden
                    name="password"
                    component={TextField}
                    className="shrink-0"
                    label={c('Label').t`Password`}
                />
            </FieldsetCluster>
            <div className="flex justify-space-between gap-3 mt-1">
                <Button
                    pill
                    color="norm"
                    shape="outline"
                    onClick={() => {
                        onTelemetry(
                            TelemetryEventName.AutosaveDismissed,
                            {},
                            { dismissReason: 'not_now', modelVersion: MODEL_VERSION }
                        );
                        controller.close({ discard: shouldDiscard });
                    }}
                >
                    {c('Action').t`Not now`}
                </Button>
                <Button pill color="norm" type="submit" loading={busy} disabled={busy} className="flex-auto">
                    <span className="text-ellipsis">
                        {(() => {
                            const { type } = form.values;
                            if (type === AutosaveMode.NEW) {
                                return busy ? c('Action').t`Saving` : c('Action').t`Add`;
                            }
                            return busy ? c('Action').t`Updating` : c('Action').t`Update`;
                        })()}
                    </span>
                </Button>
            </div>
        </>
    );
};
