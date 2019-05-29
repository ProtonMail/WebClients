import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, Icon, useModals } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import EditLabelModal from '../../containers/labels/modals/Edit';

function ActionsLabelToolbar({ onAdd }) {
    const { createModal } = useModals();

    const handleClickAdd = (type) => () => {
        return createModal(<EditLabelModal onAdd={onAdd} type={type} />);
    };

    return (
        <>
            <PrimaryButton onClick={handleClickAdd('folder')}>
                <Icon name="folder" style={{ fill: 'currentColor' }} className="mr0-5" />
                {c('Action').t`Add Folder`}
            </PrimaryButton>
            <PrimaryButton onClick={handleClickAdd('label')} className="ml1">
                <Icon name="label" style={{ fill: 'currentColor' }} className="mr0-5" />
                {c('Action').t`Add Label`}
            </PrimaryButton>
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
