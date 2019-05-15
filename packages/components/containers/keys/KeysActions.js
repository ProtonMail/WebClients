import PropTypes from 'prop-types';
import React from 'react';
import { DropdownActions } from 'react-components';
import { c } from 'ttag';

export const ACTIONS = {
    PRIMARY: 1,
    DELETE: 2,
    EXPORT: 3,
    REACTIVATE: 4,
    MARK_COMPROMISED: 5,
    MARK_OBSOLETE: 6,
    MARK_VALID: 7
};

const KeyActionExport = () => ({
    text: c('Keys actions').t`Export`
});
const KeyActionDelete = () => ({
    text: c('Keys actions').t`Delete`
});
const KeyActionPrimary = () => ({
    text: c('Keys actions').t`Make primary`
});
const KeyActionReactive = () => ({
    text: c('Keys actions').t`Reactivate`
});
const KeyActionMarkCompromised = () => ({
    text: c('Keys actions').t`Mark compromised`
});
const KeyActionMarkObsolete = () => ({
    text: c('Keys actions').t`Mark obsolete`
});
const KeyActionMarkValid = () => ({
    text: c('Keys actions').t`Mark valid`
});

const ACTIONS_TO_TEXT = {
    [ACTIONS.PRIMARY]: KeyActionPrimary,
    [ACTIONS.DELETE]: KeyActionDelete,
    [ACTIONS.EXPORT]: KeyActionExport,
    [ACTIONS.REACTIVATE]: KeyActionReactive,
    [ACTIONS.MARK_COMPROMISED]: KeyActionMarkCompromised,
    [ACTIONS.MARK_OBSOLETE]: KeyActionMarkObsolete,
    [ACTIONS.MARK_VALID]: KeyActionMarkValid
};

const KeysActions = ({ actions }) => {
    const list = actions.map(({ action, cb }) => ({
        text: ACTIONS_TO_TEXT[action]().text,
        onClick: cb
    }));

    return <DropdownActions list={list} />;
};

KeysActions.propTypes = {
    actions: PropTypes.array.isRequired
};

export default KeysActions;
