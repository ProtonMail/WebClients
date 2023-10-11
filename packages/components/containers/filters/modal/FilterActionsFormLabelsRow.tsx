import { Fragment } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useUser } from '@proton/components/hooks';
import { hasReachedLabelLimit } from '@proton/shared/lib/helpers/folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';

import { Checkbox, Icon, LabelStack, useModalState } from '../../../components';
import EditLabelModal, { LabelModel } from '../../labels/modals/EditLabelModal';
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
    const [user] = useUser();
    const { labelAs } = actions;
    const { isOpen } = labelAs;

    const [editLabelProps, setEditLabelModalOpen] = useModalState();

    const canCreateLabel = !hasReachedLabelLimit(user, labels);

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

    const handleCreateLabel = (label: LabelModel) => {
        if (label.Path) {
            handleChangeModel({ labels: [...labelAs.labels, label.Path] });
        }
    };

    const handleCheckLabel = (checkedLabel: Label) => {
        const isLabelCheck = labelAs.labels.indexOf(checkedLabel.Path) === -1;

        let nextLabels = [...labelAs.labels];
        nextLabels = isLabelCheck
            ? [...nextLabels, checkedLabel.Path]
            : nextLabels.filter((labelPath) => checkedLabel.Path !== labelPath);

        handleChangeModel({ labels: nextLabels });
    };

    const renderClosed = () => {
        if (!labelAs?.labels.length) {
            return <em className="color-weak">{c('Info').t`No label selected`}</em>;
        }

        return (
            <div>
                {labelAs?.labels.map((labelName: string) => {
                    const label = labels?.find((l) => l.Name === labelName);

                    return label ? (
                        <Fragment key={labelName}>
                            <span className="mx-2 mb-2">
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
                        </Fragment>
                    ) : null;
                })}
            </div>
        );
    };

    return (
        <div
            className="border-bottom flex-no-min-children flex-column md:flex-row align-items-center py-4"
            data-testid="filter-modal:label-row"
        >
            <button
                type="button"
                className={clsx(['w-full md:w-1/5 text-left', isNarrow && 'mb-4'])}
                onClick={toggleSection}
            >
                <Icon name="chevron-down" className={clsx([isOpen && 'rotateX-180'])} />
                <span className={clsx(['ml-2', actions.error && 'color-danger'])}>{c('Label').t`Label as`}</span>
            </button>
            <div className={clsx(['flex-item-fluid', !isNarrow && 'ml-4'])}>
                {isOpen ? (
                    <>
                        <div className="w-full">
                            {labels.length ? (
                                labels.map((label) => (
                                    <div className="mb-2 inline-block text-ellipsis" key={label.Path}>
                                        <Checkbox
                                            title={label.Name}
                                            className="mr-4 flex-nowrap"
                                            checked={labelAs.labels.includes(label.Path)}
                                            onChange={() => handleCheckLabel(label)}
                                            labelOnClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="inline-flex align-middle">
                                                <LabelStack
                                                    labels={[
                                                        {
                                                            name: label.Name,
                                                            color: label.Color,
                                                        },
                                                    ]}
                                                />
                                            </span>
                                        </Checkbox>
                                    </div>
                                ))
                            ) : (
                                <div className="mb-4 color-weak">{c('Label').t`No label found`}</div>
                            )}
                        </div>
                        {canCreateLabel && (
                            <Button shape="outline" className="mt-0" onClick={() => setEditLabelModalOpen(true)}>
                                {c('Action').t`Create label`}
                            </Button>
                        )}
                        <EditLabelModal {...editLabelProps} onAdd={handleCreateLabel} type="label" />
                    </>
                ) : (
                    <div>{renderClosed()}</div>
                )}
            </div>
        </div>
    );
};
export default FilterActionsFormLabelsRow;
