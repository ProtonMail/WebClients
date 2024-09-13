import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import { Checkbox } from '../../../components';
import type { Actions } from '../interfaces';

interface Props {
    actions: Actions;
    handleUpdateActions: (onUpdateActions: Partial<Actions>) => void;
}

type ChangePayload = {
    read: boolean;
    starred: boolean;
    isOpen: boolean;
};

const FilterActionsFormMarkAsRow = ({ actions, handleUpdateActions }: Props) => {
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
                    <span className="inline-flex items-center mr-8">
                        <Icon name="eye" className="mr-2" />
                        {c('Label').t`Read`}
                    </span>
                )}
                {markAs?.starred && (
                    <span className="inline-flex items-center">
                        <Icon name="star" className="mr-2" />
                        {c('Label').t`Starred`}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div
            className="border-bottom flex flex-column md:flex-row flex-nowrap align-items-center py-4 gap-4"
            data-testid="filter-modal:mark-as-row"
        >
            <button type="button" className="w-full md:w-1/4 text-left" onClick={toggleSection}>
                <Icon name="chevron-down" className={clsx([isOpen && 'rotateX-180'])} />
                <span className={clsx(['ml-2', actions.error && 'color-danger'])}>{c('Label').t`Mark as`}</span>
            </button>
            <div className="flex flex-column w-full">
                {isOpen ? (
                    <div className="w-full py-2">
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
