import React from 'react';
import { c } from 'ttag';

import { Label } from '@proton/shared/lib/interfaces/Label';
import { Checkbox, Button, Icon, LabelStack } from '../../../components';
import { classnames } from '../../../helpers';
import { useModals } from '../../../hooks';

import EditLabelModal from '../../labels/modals/EditLabelModal';

import { Actions } from '../interfaces';

interface Props {
    labels: Label[];
    isNarrow: boolean;
    actions: Actions;
    handleUpdateActions: (onUpdateActions: Partial<Actions>) => void;
}

type ChangePayload = {
    labels: string[];
    isOpen: boolean;
};

const FilterActionsFormLabelsRow = ({ actions, isNarrow, handleUpdateActions, labels }: Props) => {
    const { createModal } = useModals();
    const { labelAs } = actions;
    const { isOpen } = labelAs;

    const handleChangeModel = (payload: Partial<ChangePayload>) => {
        handleUpdateActions({
            labelAs: {
                ...actions.labelAs,
                ...payload,
            },
        });
    };

    const toggleSection = () => {
        handleChangeModel({ isOpen: !isOpen });
    };

    const handleCreateLabel = async () => {
        const label: Label = await new Promise((resolve, reject) => {
            createModal(
                <EditLabelModal onAdd={resolve as () => undefined} onClose={reject as () => undefined} type="label" />
            );
        });

        handleChangeModel({ labels: [...labelAs.labels, label.Name] });
    };

    const renderClosed = () => {
        if (!labelAs?.labels.length) {
            return <em>{c('Info').t`No label selected`}</em>;
        }

        return (
            <div>
                {labelAs?.labels.map((labelName: string) => {
                    const label = labels?.find((l) => l.Name === labelName);

                    return label ? (
                        <React.Fragment key={labelName}>
                            <span className="ml0-5 mr0-5 mb0-5">
                                <LabelStack
                                    labels={[
                                        {
                                            name: label.Name,
                                            color: label.Color,
                                            title: label.Name,
                                        },
                                    ]}
                                />
                            </span>
                        </React.Fragment>
                    ) : null;
                })}
            </div>
        );
    };

    return (
        <div className="border-bottom flex flex-nowrap on-mobile-flex-column align-items-center pt1 pb1">
            <button type="button" className={classnames(['w20 text-left', isNarrow && 'mb1'])} onClick={toggleSection}>
                <Icon name="caret" className={classnames([isOpen && 'rotateX-180'])} />
                <span className={classnames(['ml0-5', actions.error && 'color-danger'])}>{c('Label').t`Label as`}</span>
            </button>
            <div className={classnames(['flex-item-fluid', !isNarrow && 'ml1'])}>
                {isOpen ? (
                    <>
                        <div className="w100">
                            {labels.length ? (
                                labels.map((label: Label) => (
                                    <div className="mb0-5 inline-block text-ellipsis" key={label.Name}>
                                        <Checkbox
                                            className="mr1 flex-nowrap"
                                            checked={labelAs.labels.includes(label.Name)}
                                            onChange={() => {
                                                const index = labelAs.labels.indexOf(label.Name);
                                                if (index >= 0) {
                                                    labelAs.labels.splice(index, 1);
                                                    handleChangeModel({ labels: [...labelAs.labels] });
                                                } else {
                                                    handleChangeModel({ labels: [...labelAs.labels, label.Name] });
                                                }
                                            }}
                                            labelOnClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="inline-flex align-middle">
                                                <LabelStack
                                                    labels={[
                                                        {
                                                            name: label.Name,
                                                            color: label.Color,
                                                            title: label.Name,
                                                        },
                                                    ]}
                                                />
                                            </span>
                                        </Checkbox>
                                    </div>
                                ))
                            ) : (
                                <div className="pt0-5 mb1">{c('Label').t`No label found`}</div>
                            )}
                        </div>
                        <Button shape="outline" className="mt0" onClick={handleCreateLabel}>
                            {c('Action').t`Create label`}
                        </Button>
                    </>
                ) : (
                    <div className="mt0-5">{renderClosed()}</div>
                )}
            </div>
        </div>
    );
};
export default FilterActionsFormLabelsRow;
