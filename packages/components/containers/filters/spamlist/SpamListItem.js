import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SubTitle, Bordered, Loader, Alert, Group } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import AddEmailFilterListButton from './AddEmailFilterListButton';
import MoveEmailFilteredList from './MoveEmailFilteredList';
import RemoveEmailFilteredList from './RemoveEmailFilteredList';

import './SpamListItem.scss';

function SpamListItem({ list, type, dest, onAction, className, loading }) {
    const I18N = {
        whitelist: c('Title').t`Whitelist`,
        blacklist: c('Title').t`BlackList`,
        empty(mode) {
            const type = this[mode];
            return c('Info').t`No emails in the ${type}, click Add to add addresses to the ${type}`;
        }
    };

    return (
        <Bordered className={'flex-autogrid-item '.concat(className)}>
            <header className="mt1 flex flex-spacebetween">
                <SubTitle>{I18N[type]}</SubTitle>
                <div>
                    <AddEmailFilterListButton type={type} onAdd={onAction('create')} />
                </div>
            </header>

            {loading ? (
                <Loader />
            ) : (
                <ul className="unstyled scroll-if-needed SpamListItem-list m0 mt1">
                    {list.map((mail) => {
                        return (
                            <li className="flex mb0-5 pl1" key={mail.ID}>
                                <span className="ellipsis">{mail.Email}</span>
                                <Group className="mlauto">
                                    <MoveEmailFilteredList
                                        dest={dest}
                                        type={type}
                                        email={mail}
                                        className="pm-group-button"
                                        onClick={onAction('move')}
                                    />
                                    <RemoveEmailFilteredList
                                        className="pm-group-button"
                                        type={type}
                                        email={mail}
                                        onClick={onAction('remove')}
                                    />
                                </Group>
                            </li>
                        );
                    })}
                </ul>
            )}
            {!list.length && !loading && <Alert className="m1">{I18N.empty(type)}</Alert>}
        </Bordered>
    );
}

SpamListItem.propTypes = {
    list: PropTypes.array.isRequired,
    className: PropTypes.string,
    loading: PropTypes.bool,
    type: PropTypes.string.isRequired,
    onAction: PropTypes.func
};

SpamListItem.defaultProps = {
    onAction: noop
};

export default SpamListItem;
