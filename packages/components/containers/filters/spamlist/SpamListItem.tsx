import React from 'react';
import { c } from 'ttag';
import { IncomingDefault } from 'proton-shared/lib/interfaces/IncomingDefault';
import { WHITELIST_LOCATION, BLACKLIST_LOCATION } from 'proton-shared/lib/constants';
import { Bordered, Loader, Alert, DropdownActions, PrimaryButton } from '../../../components';
import { classnames } from '../../../helpers';

import './SpamListItem.scss';

type WHITE_OR_BLACK_LOCATION = typeof WHITELIST_LOCATION | typeof BLACKLIST_LOCATION;

interface Props {
    list: IncomingDefault[];
    type: WHITE_OR_BLACK_LOCATION;
    loading: boolean;
    className?: string;
    onCreate: (type: WHITE_OR_BLACK_LOCATION) => void;
    onEdit: (type: WHITE_OR_BLACK_LOCATION, incomingDefault: IncomingDefault) => void;
    onMove: (incomingDefault: IncomingDefault) => void;
    onRemove: (incomingDefault: IncomingDefault) => void;
}

function SpamListItem({ list, type, onCreate, onEdit, onMove, onRemove, className, loading }: Props) {
    const I18N = {
        [WHITELIST_LOCATION]: c('Title').t`Allow List`,
        [BLACKLIST_LOCATION]: c('Title').t`Block List`,
        empty(mode: WHITE_OR_BLACK_LOCATION) {
            // we do not use the variable for both mode because of declension issues with ex: Polish
            if (mode === WHITELIST_LOCATION) {
                return c('Info')
                    .t`No emails or domains in the Allow List, click Add to add addresses or domains to the Allow List.`;
            }

            return c('Info')
                .t`No emails or domains in the Block List, click Add to add addresses or domains to the Block List.`;
        },
    };

    return (
        <Bordered className={classnames(['flex-item-fluid', className])}>
            <header className="flex flex-justify-space-between flex-align-items-center">
                <h3 className="mb0">{I18N[type]}</h3>
                <div>
                    <PrimaryButton onClick={() => onCreate(type)}>{c('Action').t`Add`}</PrimaryButton>
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
                                <DropdownActions
                                    className="button--small"
                                    list={[
                                        {
                                            text: c('Action').t`Edit`,
                                            onClick() {
                                                onEdit(type, item);
                                            },
                                        },
                                        {
                                            text:
                                                type === WHITELIST_LOCATION
                                                    ? c('Action').t`Move to Block List`
                                                    : c('Action').t`Move to Allow List`,
                                            onClick() {
                                                onMove(item);
                                            },
                                        },
                                        {
                                            text: c('Action').t`Delete`,
                                            actionType: 'delete',
                                            onClick() {
                                                onRemove(item);
                                            },
                                        } as const,
                                    ]}
                                />
                            </li>
                        );
                    })}
                </ul>
            )}
            {!list.length && !loading && <Alert>{I18N.empty(type)}</Alert>}
        </Bordered>
    );
}

export default SpamListItem;
