import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, useModals } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import EditLabelModal from './modals/Edit';

function ActionsLabelToolbar({ onAdd }) {
    const { createModal } = useModals();

    const handleClickAdd = (type) => () => {
        return createModal(<EditLabelModal onAdd={onAdd} type={type} />);
    };

    return (
        <>
            <PrimaryButton onClick={handleClickAdd('folder')} className="mr1">
                {c('Action').t`Add folder`}
            </PrimaryButton>
            <PrimaryButton onClick={handleClickAdd('label')}>{c('Action').t`Add label`}</PrimaryButton>
        </>
    );
}

ActionsLabelToolbar.propTypes = {
    onAdd: PropTypes.func,
    onSort: PropTypes.func
};

ActionsLabelToolbar.defaultProps = {
    onAdd: noop,
    onSort: noop
};

export default ActionsLabelToolbar;
