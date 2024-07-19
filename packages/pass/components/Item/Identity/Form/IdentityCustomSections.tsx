import type { FC } from 'react';

import { FieldArray, type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Icon, useModalStateWithData } from '@proton/components/components';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import {
    DeleteButton,
    ExtraFieldComponent,
    type ExtraFieldProps,
} from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import { getNewField } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { IdentityAddNewSection } from '@proton/pass/components/Item/Identity/Identity.modal';
import { CollapsibleSection } from '@proton/pass/components/Layout/Collapsible/CollapsibleSection';
import { DropdownMenuBase } from '@proton/pass/components/Layout/Dropdown/DropdownMenuBase';
import type { IdentityItemFormValues, UnsafeItemExtraSection } from '@proton/pass/types';

type FormTouched = { extraSections?: { sectionFields?: boolean[] }[] };
type FormErrors = ExtraFieldProps['error'][][];

type IdentityCustomSectionsProps = {
    form: FormikContextType<IdentityItemFormValues>;
};

export const IdentityCustomSections: FC<IdentityCustomSectionsProps> = ({ form }) => {
    const [showWarningMessage, setShowWarningMessage] = useModalStateWithData<number>();

    return (
        <FieldArray
            name="extraSections"
            render={(extraSectionsHelpers) => (
                <>
                    {extraSectionsHelpers.form.values.extraSections.map(
                        ({ sectionName, sectionFields }: UnsafeItemExtraSection, sectionIndex: number) => {
                            const sectionKey = `extraSections[${sectionIndex}].sectionFields`;
                            return (
                                <CollapsibleSection
                                    key={sectionKey}
                                    label={sectionName}
                                    expanded
                                    suffix={
                                        <DeleteButton
                                            size="small"
                                            onDelete={() => extraSectionsHelpers.remove(sectionIndex)}
                                        />
                                    }
                                >
                                    <FieldArray
                                        name={sectionKey}
                                        render={(helpers) => (
                                            <>
                                                <FieldsetCluster>
                                                    {sectionFields.map(({ type }, index: number) => (
                                                        <Field
                                                            key={`${sectionName}[${index}]`}
                                                            component={ExtraFieldComponent}
                                                            type={type}
                                                            name={`${sectionKey}[${index}]`}
                                                            onDelete={() => {
                                                                if (sectionFields.length === 1) {
                                                                    setShowWarningMessage(sectionIndex);
                                                                } else {
                                                                    helpers.remove(index);
                                                                }
                                                            }}
                                                            touched={
                                                                (form.touched as FormTouched).extraSections?.[
                                                                    sectionIndex
                                                                ]?.sectionFields?.[index]
                                                            }
                                                            error={(form.errors as FormErrors)?.[sectionIndex]?.[index]}
                                                            autoFocus
                                                        />
                                                    ))}
                                                </FieldsetCluster>
                                                <DropdownMenuBase
                                                    className="mb-2"
                                                    dropdownOptions={[
                                                        {
                                                            value: 'text',
                                                            label: c('Label').t`Text field`,
                                                            onClick: () => helpers.push(getNewField('text')),
                                                        },
                                                        {
                                                            value: 'hidden',
                                                            label: c('Label').t`Hidden field`,
                                                            onClick: () => helpers.push(getNewField('hidden')),
                                                        },
                                                    ]}
                                                >
                                                    <div className="flex items-center">
                                                        <Icon name="plus" />
                                                        <div className="ml-2 text-semibold">{c('Action')
                                                            .t`Add more`}</div>
                                                    </div>
                                                </DropdownMenuBase>
                                            </>
                                        )}
                                    />
                                </CollapsibleSection>
                            );
                        }
                    )}
                    <hr />
                    <IdentityAddNewSection
                        onAdd={(sectionName: string) => {
                            extraSectionsHelpers.push({
                                sectionName,
                                sectionFields: [getNewField('text')],
                            });
                        }}
                    />
                    <ConfirmationModal
                        open={showWarningMessage.open}
                        onClose={showWarningMessage.onClose}
                        onSubmit={() => extraSectionsHelpers.remove(showWarningMessage.data ?? 0)}
                        submitText={c('Action').t`Delete section`}
                        title={c('Title').t`Remove section?`}
                        alertText={c('Warning').t`Removing the last field will remove the custom section.`}
                    />
                </>
            )}
        />
    );
};
