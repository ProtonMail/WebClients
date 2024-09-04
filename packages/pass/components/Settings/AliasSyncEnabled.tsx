import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Field } from '@proton/pass/components/Form/Field/Field';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { aliasSyncEnable } from '@proton/pass/store/actions';
import { selectDefaultVault, selectUserDefaultShareId } from '@proton/pass/store/selectors';
import { BRAND_NAME } from '@proton/shared/lib/constants';

type FormValues = { shareId: string };

export const AliasSyncEnabled: FC = () => {
    const serverDefaultShareId = useSelector(selectUserDefaultShareId);
    const localDefaultShareId = useSelector(selectDefaultVault).shareId;
    const shareId = serverDefaultShareId ?? localDefaultShareId;
    const { loading, dispatch } = useRequest(aliasSyncEnable, {});

    const form = useFormik<FormValues>({
        initialValues: { shareId },
        enableReinitialize: true,
        onSubmit: ({ shareId }) => dispatch(shareId),
    });

    return (
        <SettingsPanel title={c('Label').t`Sync aliases with SimpleLogin`}>
            <div className="text-sm color-weak mb-4">
                {c('Info').t`Alias syncing between your ${BRAND_NAME} and SimpleLogin accounts is active.`}
            </div>
            <FormikProvider value={form}>
                <Form>
                    <Field
                        className="pass-vault--select-field pass-input-group--no-focus"
                        component={VaultPickerField}
                        label={
                            <span className="color-norm block mb-1 text-lg text-bold text-ellipsis">
                                {c('Label').t`Select the vault where SimpleLogin aliases will be imported into`}
                            </span>
                        }
                        legacy
                        name="shareId"
                        onValue={() => form.handleSubmit()}
                        loading={loading}
                    />
                </Form>
            </FormikProvider>
        </SettingsPanel>
    );
};
