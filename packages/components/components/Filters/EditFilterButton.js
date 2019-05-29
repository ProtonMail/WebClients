import React from 'react';
import PropTypes from 'prop-types';
import { Button, useModals } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import AddFilterModal from '../../containers/Filters/AddFilterModal';

function EditFilterButton({ filter, type, className, onEditFilter, textContent }) {
    const { createModal } = useModals();

    const handleClick = () =>
        createModal(<AddFilterModal mode="update" filter={filter} type={type} onEdit={onEditFilter} />);

    return (
        <Button className={className} onClick={handleClick}>
            {textContent}
        </Button>
    );
}

EditFilterButton.propTypes = {
    filter: PropTypes.object.isRequired,
    className: PropTypes.string,
    onEditFilter: PropTypes.func
};

EditFilterButton.defaultProps = {
    onEditFilter: noop
};

export default EditFilterButton;
