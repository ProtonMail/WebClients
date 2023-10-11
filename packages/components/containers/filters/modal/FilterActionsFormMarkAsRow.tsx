import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { Checkbox, Icon } from '../../../components';
import { Actions } from '../interfaces';

interface Props {
    isNarrow: boolean;
    actions: Actions;
    handleUpdateActions: (onUpdateActions: Partial<Actions>) => void;
}

type ChangePayload = {
    read: boolean;
    starred: boolean;
    isOpen: boolean;
};

const FilterActionsFormMarkAsRow = ({ isNarrow, actions, handleUpdateActions }: Props) => {
    const { markAs } = actions;
    const { isOpen } = markAs;

    const handleChangeModel = (payload: Partial<ChangePayload>) => {
        handleUpdateActions({
            markAs: {
                ...actions.markAs,
                ...payload,
            },
        });
    };

    const toggleSection = () => {
        handleChangeModel({ isOpen: !isOpen });
    };

    const renderClosed = () => {
        if (!markAs?.read && !markAs?.starred) {
            return <em className="color-weak">{c('Info').t`No action selected`}</em>;
        }

        return (
            <div>
                {markAs?.read && (
                    <span className="inline-flex flex-align-items-center mr-8">
                        <Icon name="eye" className="mr-2" />
                        {c('Label').t`Read`}
                    </span>
                )}
                {markAs?.starred && (
                    <span className="inline-flex flex-align-items-center">
                        <Icon name="star" className="mr-2" />
                        {c('Label').t`Starred`}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div
            className="border-bottom flex-no-min-children flex-column md:flex-row align-items-center py-4"
            data-testid="filter-modal:mark-as-row"
        >
            <button
                type="button"
                className={clsx(['w-full md:w-1/5 text-left', isNarrow && 'mb-4'])}
                onClick={toggleSection}
            >
                <Icon name="chevron-down" className={clsx([isOpen && 'rotateX-180'])} />
                <span className={clsx(['ml-2', actions.error && 'color-danger'])}>{c('Label').t`Mark as`}</span>
            </button>
            <div className={clsx(['flex flex-column flex-item-fluid', !isNarrow && 'ml-4'])}>
                {isOpen ? (
                    <div className="w-100 py-2">
                        <Checkbox
                            checked={markAs.read}
                            onChange={(e) => {
                                handleChangeModel({ read: e.target.checked });
                            }}
                            labelOnClick={(e) => e.stopPropagation()}
                        >
                            <span>{c('Label').t`Read`}</span>
                        </Checkbox>
                        <Checkbox
                            className="ml-8"
                            checked={markAs.starred}
                            onChange={(e) => {
                                handleChangeModel({
                                    starred: e.target.checked,
                                });
                            }}
                            labelOnClick={(e) => e.stopPropagation()}
                        >
                            <span>{c('Label').t`Starred`}</span>
                        </Checkbox>
                    </div>
                ) : (
                    renderClosed()
                )}
            </div>
        </div>
    );
};
export default FilterActionsFormMarkAsRow;
