import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SmallButton, useModals } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import EditLabelModal from './modals/Edit';

function EditLabelButton({ label, onChange, className }) {
    const { createModal } = useModals();

    const handleClickAdd = () => createModal(<EditLabelModal label={label} mode="edition" onEdit={onChange} />);

    return (
        <SmallButton onClick={handleClickAdd} className={className}>
            {c('Action').t`Edit`}
        </SmallButton>
    );
}

EditLabelButton.propTypes = {
    label: PropTypes.object.isRequired,
    className: PropTypes.string,
    onChange: PropTypes.func
};

EditLabelButton.defaultProps = {
    onChange: noop
};

export default EditLabelButton;
