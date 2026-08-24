import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Form, type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { MAX_ITEM_NAME_LENGTH } from '../../../constants';
import { useIdentityForm } from '../../../hooks/identity/useIdentityForm';
import { usePortal } from '../../../hooks/usePortal';
import { selectVaultLimits } from '../../../store/selectors';
import type { IdentityItemFormValues, ItemRevision } from '../../../types';
import { FileAttachmentsField } from '../../FileAttachments/FileAttachmentsField';
import { FileAttachmentsFieldEdit } from '../../FileAttachments/FileAttachmentsFieldEdit';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TitleField } from '../../Form/Field/TitleField';
import { VaultPickerField } from '../../Form/Field/VaultPickerField';
import { ItemCreatePanel } from '../../Layout/Panel/ItemCreatePanel';
import { ItemEditPanel } from '../../Layout/Panel/ItemEditPanel';
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
