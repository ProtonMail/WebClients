import React from 'react';
import { c } from 'ttag';
import { IncomingDefault } from 'proton-shared/lib/interfaces/IncomingDefault';
import { WHITELIST_LOCATION, BLACKLIST_LOCATION } from 'proton-shared/lib/constants';
import { Icon, Loader, Button, Tooltip } from '../../../components';
import { classnames } from '../../../helpers';

import './SpamListItem.scss';

type WHITE_OR_BLACK_LOCATION = typeof WHITELIST_LOCATION | typeof BLACKLIST_LOCATION;

interface Props {
    list: IncomingDefault[];
    type: WHITE_OR_BLACK_LOCATION;
    loading: boolean;
    className?: string;
    onCreate: (type: WHITE_OR_BLACK_LOCATION) => void;
    onMove: (incomingDefault: IncomingDefault) => void;
    onRemove: (incomingDefault: IncomingDefault) => void;
}

function SpamListItem({ list, type, onCreate, onMove, onRemove, className, loading }: Props) {
    const I18N = {
        [WHITELIST_LOCATION]: c('Title').t`Allow List`,
        [BLACKLIST_LOCATION]: c('Title').t`Block List`,
        empty(mode: WHITE_OR_BLACK_LOCATION) {
            // we do not use the variable for both mode because of declension issues with ex: Polish
            if (mode === WHITELIST_LOCATION) {
                return c('Info').t`Your Allow List is empty.`;
            }

            return c('Info').t`Your Block List is empty.`;
        },
    };

    return (
        <div className={classnames(['flex-item-fluid', className])}>
            <header className="flex flex-justify-space-between flex-align-items-center pb1 border-bottom">
                <h3 className="mb0 text-bold">{I18N[type]}</h3>
                <div>
                    <Button size="small" color="norm" onClick={() => onCreate(type)}>
                        {c('Action').t`Add`}
                    </Button>
                </div>
            </header>

            {loading ? (
                <Loader />
            ) : (
                <ul className="unstyled scroll-if-needed SpamListItem-list m0 mt1">
                    {list.map((item) => {
                        return (
                            <li
                                className="flex flex-nowrap flex-align-items-center flex-justify-space-between mb0-5"
                                key={item.ID}
                            >
                                <span className="flex-item-fluid text-ellipsis mr0-5" title={item.Email || item.Domain}>
                                    {item.Email || item.Domain}
                                </span>
                                <Tooltip
                                    title={
                                        type === WHITELIST_LOCATION
                                            ? c('Action').t`Move to Block List`
                                            : c('Action').t`Move to Allow List`
                                    }
                                >
                                    <Button
                                        size="small"
                                        shape="outline"
                                        onClick={() => onMove(item)}
                                        className="p0-5"
                                        icon
                                    >
                                        <Icon name="arrow-double-horizontal" size={16} />
                                    </Button>
                                </Tooltip>

                                <Tooltip title={c('Action').t`Delete`}>
                                    <Button
                                        size="small"
                                        shape="outline"
                                        onClick={() => onRemove(item)}
                                        className="p0-5 ml1"
                                        icon
                                    >
                                        <Icon name="trash" size={16} />
                                    </Button>
                                </Tooltip>
                            </li>
                        );
                    })}
                </ul>
            )}
            {!list.length && !loading && <div>{I18N.empty(type)}</div>}
        </div>
    );
}

export default SpamListItem;
