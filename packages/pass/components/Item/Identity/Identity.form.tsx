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
import { useIdentityForm } from '@proton/pass/hooks/identity/useIdentityForm';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { selectVaultLimits } from '@proton/pass/store/selectors';
import type { IdentityItemFormValues } from '@proton/pass/types';

import { IdentityCustomSections } from './Form/IdentityCustomSections';
import { IdentitySection } from './Form/IdentitySection';

type IdentityFormType = {
    form: FormikContextType<IdentityItemFormValues>;
    editing?: boolean;
    onCancel: () => void;
};

export const IdentityForm: FC<IdentityFormType> = ({ form, editing = false, onCancel }) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { sections, addOptionalField } = useIdentityForm(form.values, editing);
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
            valid={form.isValid && form.dirty}
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

                        {sections.map((section, sectionIndex) => (
                            <IdentitySection
                                key={section.name}
                                form={form}
                                onAddOptionalField={(field) => addOptionalField?.(sectionIndex, field)}
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
