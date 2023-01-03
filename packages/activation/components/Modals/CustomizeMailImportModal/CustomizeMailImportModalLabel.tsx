import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Field, Icon, Label, LabelStack, Row, Tooltip, useModalState } from '@proton/components/components';
import EditLabelModal, { LabelModel } from '@proton/components/containers/labels/modals/EditLabelModal';

interface Props {
    label: Pick<LabelModel, 'Name' | 'Color' | 'Type'>;
    onEditLabel: (label: Pick<LabelModel, 'Name' | 'Color' | 'Type'>) => void;
}

const CustomizeMailImportModalLabel = ({ label, onEditLabel }: Props) => {
    const [editLabelModalProps, openEditLabelModal, renderEditLabelModal] = useModalState();

    return (
        <div className="mb1 border-bottom flex-align-items-center">
            <Row>
                <Label className="flex flex-align-items-center">
                    {c('Label').t`Label messages as`}
                    <Tooltip title={c('Tooltip').t`Each imported email will have this label`}>
                        <Icon name="info-circle" className="ml0-5" />
                    </Tooltip>
                </Label>
                <Field className="wauto flex flex-align-items-center flex-nowrap">
                    {label.Name && (
                        <LabelStack
                            labels={[
                                {
                                    name: label.Name,
                                    color: label.Color,
                                    title: label.Name,
                                },
                            ]}
                            className="max-w100"
                        />
                    )}
                    <Button
                        shape="outline"
                        className="flex-item-noshrink ml1"
                        onClick={() => openEditLabelModal(true)}
                        data-testid="CustomizeModal:editLabel"
                    >
                        {c('Action').t`Edit label`}
                    </Button>
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
