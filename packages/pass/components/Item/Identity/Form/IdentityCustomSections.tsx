import type { FC } from 'react';

import { FieldArray, type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, useModalStateWithData } from '@proton/components/components';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { DeleteButton, ExtraFieldComponent } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraField';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { IdentityAddNewSection } from '@proton/pass/components/Item/Identity/Identity.modal';
import { EMPTY_CUSTOM_FIELD } from '@proton/pass/components/Item/Identity/Identity.new';
import { CollapsibleSection } from '@proton/pass/components/Layout/Collapsible/CollapsibleSection';
import type { IdentityItemFormValues, UnsafeItemExtraSection } from '@proton/pass/types';

type IdentityCustomSectionsProps = {
    form: FormikContextType<IdentityItemFormValues>;
};

export const IdentityCustomSections: FC<IdentityCustomSectionsProps> = ({ form }) => {
    const [showWarningMessage, setShowWarningMessage] = useModalStateWithData<number>();

    return (
        <FieldArray
            name="extraSections"
            render={(extraSectionsHelpers) => {
                return (
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
                                            render={(helpers) => {
                                                return (
                                                    <>
                                                        <FieldsetCluster>
                                                            {sectionFields.map((_: unknown, index: number) => (
                                                                <Field
                                                                    key={`${sectionName}[${index}]`}
                                                                    component={ExtraFieldComponent}
                                                                    type="text"
                                                                    name={`${sectionKey}[${index}]`}
                                                                    onDelete={() => {
                                                                        if (index === 0) {
                                                                            setShowWarningMessage(sectionIndex);
                                                                        } else {
                                                                            helpers.remove(index);
                                                                        }
                                                                    }}
                                                                    /* Formik TS type are wrong for FormikTouched */
                                                                    touched={
                                                                        (form.touched as any).extraSections?.[
                                                                            sectionIndex
                                                                        ]?.sectionFields?.[index]
                                                                    }
                                                                    error={
                                                                        (form.errors as any).extraSections?.[
                                                                            sectionIndex
                                                                        ]?.sectionFields?.[index]
                                                                    }
                                                                    autoFocus
                                                                />
                                                            ))}
                                                        </FieldsetCluster>
                                                        <Button
                                                            className="mb-2 rounded-full"
                                                            style={{
                                                                backgroundColor: 'var(--interaction-weak)',
                                                            }}
                                                            color="norm"
                                                            shape="ghost"
                                                            onClick={() => helpers.push(EMPTY_CUSTOM_FIELD)}
                                                        >
                                                            <div className="flex items-center">
                                                                <Icon name="plus" />
                                                                <div className="ml-2 text-semibold">{c('Action')
                                                                    .t`Add custom field`}</div>
                                                            </div>
                                                        </Button>
                                                    </>
                                                );
                                            }}
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
                                    sectionFields: [EMPTY_CUSTOM_FIELD],
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
                );
            }}
        />
    );
};
