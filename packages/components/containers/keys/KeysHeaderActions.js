import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Group, Button, ButtonGroup } from 'react-components';

export const ACTIONS = {
    ADD: 1,
    IMPORT: 2,
    EXPORT_PUBLIC_KEY: 3,
    EXPORT_PRIVATE_KEY: 4,
    REACTIVATE: 5
};

const KeysHeaderActions = ({ permissions, onAction }) => {
    return (
        <>
            <Group className="mr1">
                {permissions[ACTIONS.ADD] && (
                    <ButtonGroup onClick={() => onAction(ACTIONS.ADD)} className="pm-button--primary">
                        {c('Action').t`Add key`}
                    </ButtonGroup>
                )}
                {permissions[ACTIONS.IMPORT] && (
                    <ButtonGroup onClick={() => onAction(ACTIONS.IMPORT)}>{c('Action').t`Import key`}</ButtonGroup>
                )}
                {permissions[ACTIONS.EXPORT_PUBLIC_KEY] && (
                    <ButtonGroup onClick={() => onAction(ACTIONS.EXPORT_PUBLIC_KEY)}>
                        {c('Action').t`Export public key`}
                    </ButtonGroup>
                )}
                {permissions[ACTIONS.EXPORT_PRIVATE_KEY] && (
                    <ButtonGroup onClick={() => onAction(ACTIONS.EXPORT_PRIVATE_KEY)}>
                        {c('Action').t`Export private key`}
                    </ButtonGroup>
                )}
            </Group>
            {permissions[ACTIONS.REACTIVATE] && (
                <Button onClick={() => onAction(ACTIONS.REACTIVATE)}>{c('Action').t`Reactivate keys`}</Button>
            )}
        </>
    );
};

KeysHeaderActions.propTypes = {
    onAction: PropTypes.func.isRequired,
    permissions: PropTypes.object
};

export default KeysHeaderActions;
