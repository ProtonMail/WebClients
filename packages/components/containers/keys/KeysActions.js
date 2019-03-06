import PropTypes from 'prop-types';
import React from 'react';
import { SmallButton } from 'react-components';
import { c } from 'ttag';

const KeysActions = ({
    handleExportKey,
    handleMakePrimaryKey,
    handleMarkObsoleteKey,
    handleMarkCompromisedKey,
    handleDeleteKey
}) => {
    return (
        <>
            <SmallButton onClick={handleExportKey}>{c('Action').t`Export`}</SmallButton>
            <SmallButton onClick={handleMakePrimaryKey}>{c('Action').t`Make primary`}</SmallButton>
            <SmallButton onClick={handleMarkObsoleteKey}>{c('Action').t`Mark obsolete`}</SmallButton>
            <SmallButton onClick={handleMarkCompromisedKey}>{c('Action').t`Mark compromised`}</SmallButton>
            <SmallButton onClick={handleDeleteKey}>{c('Action').t`Delete`}</SmallButton>
        </>
    );
};

KeysActions.propTypes = {
    handleDeleteKey: PropTypes.func.isRequired,
    handleExportKey: PropTypes.func.isRequired,
    handleMakePrimaryKey: PropTypes.func.isRequired,
    handleMarkObsoleteKey: PropTypes.func.isRequired,
    handleMarkCompromisedKey: PropTypes.func.isRequired
};

export default KeysActions;
