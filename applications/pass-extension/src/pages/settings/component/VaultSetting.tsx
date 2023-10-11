/* TODO: move this to shared components */
import { type VFC } from 'react';
import type { Selector } from 'react-redux';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';

import type { ShareItem, State } from '@proton/pass/store';
import type { Maybe, ShareType } from '@proton/pass/types';

import { Field } from '../../../popup/components/Field/Field';
import { VaultSelectField } from '../../../popup/components/Field/VaultSelectField';

import './VaultSetting.scss';

type FormValues = { shareId: Maybe<string> };

type Props = {
    label: string;
    onSubmit: (share: ShareItem<ShareType.Vault>) => void;
    optionsSelector: Selector<State, ShareItem<ShareType.Vault>[]>;
    valueSelector: Selector<State, Maybe<ShareItem<ShareType.Vault>>>;
};

export const VaultSetting: VFC<Props> = ({ label, onSubmit, optionsSelector, valueSelector }) => {
    const vaults = useSelector(optionsSelector);
    const shareId = useSelector(valueSelector)?.shareId;

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
                        name="shareId"
                        className="pass-vault--select-field pass-input-group--no-focus"
                        component={VaultSelectField}
                        label={label}
                        onValue={() => form.handleSubmit()}
                    />
                </Form>
            </FormikProvider>
        </div>
    );
};
