import React from 'react';
import PropTypes from 'prop-types';
import { Button, useModals } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import AddFilterModal from '../../containers/filters/AddFilterModal';

function EditFilterButton({ filter, type, className, onEditFilter = noop, textContent }) {
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
    type: PropTypes.string,
    className: PropTypes.string,
    onEditFilter: PropTypes.func,
    textContent: PropTypes.string
};

export default EditFilterButton;
