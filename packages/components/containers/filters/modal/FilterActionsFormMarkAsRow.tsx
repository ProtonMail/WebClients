import { c } from 'ttag';

import { Checkbox, Icon } from '../../../components';
import { classnames } from '../../../helpers';

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
            return <em className="pt0-5">{c('Info').t`No action selected`}</em>;
        }

        return (
            <div className="pt0-5">
                {markAs?.read && (
                    <span className="inline-flex flex-align-items-center mr2">
                        <Icon name="eye" className="mr0-5" />
                        {c('Label').t`Read`}
                    </span>
                )}
                {markAs?.starred && (
                    <span className="inline-flex flex-align-items-center">
                        <Icon name="star" className="mr0-5" />
                        {c('Label').t`Starred`}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="border-bottom flex flex-nowrap on-mobile-flex-column align-items-center pt1 pb1">
            <button type="button" className={classnames(['w20 text-left', isNarrow && 'mb1'])} onClick={toggleSection}>
                <Icon name="angle-down" className={classnames([isOpen && 'rotateX-180'])} />
                <span className={classnames(['ml0-5', actions.error && 'color-danger'])}>{c('Label').t`Mark as`}</span>
            </button>
            <div className={classnames(['flex flex-column flex-item-fluid', !isNarrow && 'ml1'])}>
                {isOpen ? (
                    <div className="w100 pt0-5 pb0-5">
                        <Checkbox
                            checked={markAs.read}
                            onChange={(e) => {
                                handleChangeModel({ read: e.target.checked });
                            }}
                            labelOnClick={(e) => e.stopPropagation()}
                        >
                            <span className="ml0-5">{c('Label').t`Read`}</span>
                        </Checkbox>
                        <Checkbox
                            className="ml2"
                            checked={markAs.starred}
                            onChange={(e) => {
                                handleChangeModel({ starred: e.target.checked });
                            }}
                            labelOnClick={(e) => e.stopPropagation()}
                        >
                            <span className="ml0-5">{c('Label').t`Starred`}</span>
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
