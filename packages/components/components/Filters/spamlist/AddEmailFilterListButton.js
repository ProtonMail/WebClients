import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, useModals } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import AddEmailToListModal from '../../../containers/Filters/AddEmailToListModal';

function AddEmailFilterListButton({ type, className, onAdd }) {
    const { createModal } = useModals();

    const handleClick = () => createModal(<AddEmailToListModal type={type} onAdd={onAdd} />);

    return (
        <>
            <PrimaryButton className={className} onClick={handleClick}>
                {c('Action').t`Add`}
            </PrimaryButton>
        </>
    );
}

AddEmailFilterListButton.propTypes = {
    className: PropTypes.string,
    onAdd: PropTypes.func
};

AddEmailFilterListButton.defaultProps = {
    onAdd: noop
};

export default AddEmailFilterListButton;
