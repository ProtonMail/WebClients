/* TODO: move this to shared components */
import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Field } from '@proton/pass/components/Form/Field/Field';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import type { ShareItem } from '@proton/pass/store/reducers';
import { selectAutosaveVault, selectWritableVaults } from '@proton/pass/store/selectors';
import type { Maybe, ShareType } from '@proton/pass/types';

type FormValues = { shareId: Maybe<string> };
type Props = { onSubmit: (share: ShareItem<ShareType.Vault>) => void };

export const VaultSetting: FC<Props> = ({ onSubmit }) => {
    const vaults = useSelector(selectWritableVaults);
    const shareId = useSelector(selectAutosaveVault)?.shareId;

    const form = useFormik<FormValues>({
        initialValues: { shareId },
        enableReinitialize: true,
        onSubmit: async (values) => {
            const match = vaults.find((vault) => vault.shareId === values.shareId);
            if (match && match.shareId !== shareId) onSubmit(match);
        },
    });

    return (
        <div>
            <FormikProvider value={form}>
                <Form>
                    <Field
                        className="pass-vault--select-field pass-input-group--no-focus"
                        component={VaultPickerField}
                        label={<span className="block mb-1">{c('Label').t`Autosave vault`}</span>}
                        legacy
                        name="shareId"
                        onValue={() => form.handleSubmit()}
                    />
                </Form>
            </FormikProvider>
        </div>
    );
};
