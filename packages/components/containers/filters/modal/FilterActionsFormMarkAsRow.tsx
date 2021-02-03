import React from 'react';
import { c } from 'ttag';

import { Actions } from 'proton-shared/lib/filters/interfaces';
import { Checkbox, Button, Tooltip, Icon } from '../../../components';
import { classnames } from '../../../helpers';

interface Props {
    isNarrow: boolean;
    actions: Actions;
    handleUpdateActions: (onUpdateActions: Partial<Actions>) => void;
    isDark: boolean;
}

type ChangePayload = {
    read: boolean;
    starred: boolean;
    isOpen: boolean;
};

const FilterActionsFormMarkAsRow = ({ isNarrow, actions, handleUpdateActions, isDark }: Props) => {
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

    const handleClear = () => {
        handleChangeModel({ starred: false, read: false });
    };

    const renderClosed = () => {
        if (!markAs?.read && !markAs?.starred) {
            return (
                <em className={classnames(['pt0-5', isDark ? 'color-global-muted' : 'color-global-altgrey'])}>{c('Info')
                    .t`No action selected`}</em>
            );
        }

        return (
            <div className="pt0-5">
                {markAs?.read && (
                    <span className="inline-flex flex-align-items-center mr2">
                        <Icon name="read" className="mr0-5" />
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
                <Icon name="caret" className={classnames([isOpen && 'rotateX-180'])} />
                <span className={classnames(['ml0-5', actions.error && 'color-global-warning'])}>
                    {c('Label').t`Mark as`}
                </span>
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
            <div>
                <Button
                    disabled={!markAs?.read && !markAs?.starred}
                    onClick={handleClear}
                    className={classnames(['button--for-icon', isNarrow ? 'mt1' : 'ml1'])}
                >
                    <Tooltip
                        title={c('Action').t`Reset`}
                        className={classnames([isDark ? 'color-global-muted' : 'color-global-altgrey'])}
                    >
                        <Icon name="remove-text-formatting" />
                    </Tooltip>
                </Button>
            </div>
        </div>
    );
};
export default FilterActionsFormMarkAsRow;
