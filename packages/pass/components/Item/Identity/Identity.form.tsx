import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Form, type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { FileAttachmentsField } from '@proton/pass/components/FileAttachments/FileAttachmentsField';
import { FileAttachmentsFieldEdit } from '@proton/pass/components/FileAttachments/FileAttachmentsFieldEdit';
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
import type { IdentityItemFormValues, ItemRevision } from '@proton/pass/types';

import { IdentitySection } from './Identity.section';
import { IdentityCustomSections } from './Identity.sections';

type IdentityFormType = {
    form: FormikContextType<IdentityItemFormValues>;
    revision?: ItemRevision<'identity'>;
    onCancel: () => void;
};

export const IdentityForm: FC<IdentityFormType> = ({ form, revision, onCancel }) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { sections, addOptionalField } = useIdentityForm(form.values, !!revision);
    const { ParentPortal, openPortal } = usePortal();
    const [ItemPanel, formId] = useMemo(
        () => (revision ? [ItemEditPanel, 'edit-identity'] : [ItemCreatePanel, 'new-identity']),
        [revision]
    );

    return (
        <ItemPanel
            discardable={!form.dirty}
            formId={formId}
            handleCancelClick={onCancel}
            type="identity"
            valid={(!revision || form.dirty) && form.isValid && !form.status?.isBusy}
            actions={ParentPortal}
        >
            {({ didEnter }) => (
                <FormikProvider value={form}>
                    <Form id={formId}>
                        <FieldsetCluster>
                            {!revision &&
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

                        <FieldsetCluster className="mt-4">
                            {revision ? (
                                <Field
                                    name="files"
                                    component={FileAttachmentsFieldEdit}
                                    shareId={revision.shareId}
                                    itemId={revision.itemId}
                                    revision={revision.revision}
                                />
                            ) : (
                                <Field name="files" component={FileAttachmentsField} shareId={form.values.shareId} />
                            )}
                        </FieldsetCluster>
                    </Form>
                </FormikProvider>
            )}
        </ItemPanel>
    );
};
