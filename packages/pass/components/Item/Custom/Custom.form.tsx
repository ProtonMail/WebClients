import type { ReactNode, ReactPortal } from 'react';
import { useSelector } from 'react-redux';

import { Form, type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../constants';
import { selectVaultLimits } from '../../../store/selectors/limits';
import type { CustomItemFormValues, ItemRevision, ItemType, MaybeNull } from '../../../types';
import { FileAttachmentsField } from '../../FileAttachments/FileAttachmentsField';
import { FileAttachmentsFieldEdit } from '../../FileAttachments/FileAttachmentsFieldEdit';
import { ExtraFieldGroup } from '../../Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TextAreaField } from '../../Form/Field/TextareaField';
import { TitleField } from '../../Form/Field/TitleField';
import { VaultPickerField } from '../../Form/Field/VaultPickerField';
import { CustomTypeFields } from './Custom.fields';
import { CustomFormSections } from './Custom.sections';

type CustomFormProps<T extends ItemType> = {
    form: FormikContextType<CustomItemFormValues>;
    formId: string;
    didEnter: boolean;
    revision?: ItemRevision<T>;
    panelPortal?: (node: ReactNode) => MaybeNull<ReactPortal>;
};

export const CustomForm = <T extends ItemType>({
    form,
    revision,
    didEnter,
    formId,
    panelPortal,
}: CustomFormProps<T>) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);

    return (
        <FormikProvider value={form}>
            <Form id={formId} className="ui-violet">
                <FieldsetCluster>
                    {!revision &&
                        vaultTotalCount > 1 &&
                        panelPortal?.(<Field component={VaultPickerField} name="shareId" dense />)}

                    <Field
                        lengthLimiters
                        name="name"
                        label={c('Label').t`Title`}
                        placeholder={c('Placeholder').t`Untitled`}
                        component={TitleField}
                        autoFocus={didEnter}
                        key={`custom-name-${didEnter}`}
                        maxLength={MAX_ITEM_NAME_LENGTH}
                    />
                </FieldsetCluster>

                <CustomTypeFields type={form.values.type} />

                <ExtraFieldGroup form={form} hideIcon />

                <CustomFormSections form={form} />

                <FieldsetCluster>
                    <Field
                        name="note"
                        label={c('Label').t`Note`}
                        placeholder={c('Placeholder').t`Add note`}
                        component={TextAreaField}
                        icon="note"
                        maxLength={MAX_ITEM_NOTE_LENGTH}
                    />
                </FieldsetCluster>

                <FieldsetCluster>
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
    );
};
