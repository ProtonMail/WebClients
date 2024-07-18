import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Form, type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { useIdentityFormSections } from '@proton/pass/hooks/identity/useIdentityFormSections';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import type { IdentityItemFormValues, IdentityValues } from '@proton/pass/types';

import { IdentityCollapsibleSection } from './Form/IdentityCollapsibleSection';
import { IdentityCustomSections } from './Form/IdentityCustomSections';

type IdentityFormType = {
    form: FormikContextType<IdentityItemFormValues>;
    onCancel: () => void;
    editing?: boolean;
    content?: IdentityValues;
};

export const IdentityForm: FC<IdentityFormType> = ({ content, form, editing = false, onCancel }) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { sections, updateSectionFields } = useIdentityFormSections({ initialValues: content });
    const { ParentPortal, openPortal } = usePortal();
    const [ItemPanel, formId] = useMemo(
        () => (editing ? [ItemEditPanel, 'edit-identity'] : [ItemCreatePanel, 'new-identity']),
        [editing]
    );

    return (
        <ItemPanel
            discardable={!form.dirty}
            formId={formId}
            handleCancelClick={onCancel}
            type="identity"
            valid={form.isValid}
            actions={ParentPortal}
        >
            {({ didEnter }) => (
                <FormikProvider value={form}>
                    <Form id={formId}>
                        <FieldsetCluster>
                            {!editing &&
                                vaultTotalCount > 1 &&
                                openPortal(<Field component={VaultPickerField} name="shareId" dense />)}
                            <Field
                                lengthLimiters
                                name="name"
                                label={c('Label').t`Title`}
                                placeholder={c('Placeholder').t`Untitled`}
                                component={TitleField}
                                autoFocus={didEnter}
                                key={`identity-name-${didEnter}`}
                                maxLength={MAX_ITEM_NAME_LENGTH}
                            />
                        </FieldsetCluster>

                        {sections.map((section, index) => (
                            <IdentityCollapsibleSection
                                key={section.name}
                                form={form}
                                onAdd={(field: string) => updateSectionFields?.(index, field)}
                                {...section}
                            />
                        ))}

                        <IdentityCustomSections form={form} />
                    </Form>
                </FormikProvider>
            )}
        </ItemPanel>
    );
};
