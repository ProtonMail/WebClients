import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Field, Icon, Label, LabelStack, Row, Tooltip, useModalState } from '@proton/components';
import type { LabelModel } from '@proton/components/containers/labels/modals/EditLabelModal';
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';

interface Props {
    label: Pick<LabelModel, 'Name' | 'Color' | 'Type'>;
    onEditLabel: (label: Pick<LabelModel, 'Name' | 'Color' | 'Type'>) => void;
}

const CustomizeMailImportModalLabel = ({ label, onEditLabel }: Props) => {
    const [editLabelModalProps, openEditLabelModal, renderEditLabelModal] = useModalState();

    return (
        <div className="mb-4 border-bottom items-center">
            <Row>
                <Label className="flex items-center">
                    {c('Label').t`Label messages as`}
                    <Tooltip title={c('Tooltip').t`Each imported email will have this label`}>
                        <Icon name="info-circle" className="ml-2" />
                    </Tooltip>
                </Label>
                <Field className="w-auto flex items-center flex-nowrap">
                    {label.Name && (
                        <LabelStack
                            labels={[
                                {
                                    name: label.Name,
                                    color: label.Color,
                                    title: label.Name,
                                },
                            ]}
                            className="max-w-full"
                        />
                    )}
                    <Tooltip title={c('Action').t`Edit label`}>
                        <Button
                            icon
                            shape="ghost"
                            className="shrink-0 ml-4"
                            onClick={() => openEditLabelModal(true)}
                            data-testid="CustomizeModal:editLabel"
                        >
                            <Icon name="pen" alt={c('Action').t`Edit label`} />
                        </Button>
                    </Tooltip>
                </Field>
                {renderEditLabelModal && (
                    <EditLabelModal
                        {...editLabelModalProps}
                        label={label}
                        type="label"
                        onCheckAvailable={({ Color, Name, Type }) => {
                            onEditLabel({ Color, Name, Type });
                        }}
                        mode="checkAvailable"
                    />
                )}
            </Row>
        </div>
    );
};

export default CustomizeMailImportModalLabel;
