import PropTypes from 'prop-types';

import ContentModal from './Content';
import DialogModal from './Dialog';

const SimpleFormModal = ({ modalTitleID = 'modalTitle', children, onSubmit, onClose, ...rest }) => {
    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <ContentModal onSubmit={onSubmit} onReset={onClose}>
                {children}
            </ContentModal>
        </DialogModal>
    );
};

SimpleFormModal.propTypes = {
    ...DialogModal.propTypes,
    modalTitleID: PropTypes.string,
    children: PropTypes.node.isRequired,
    onSubmit: PropTypes.func,
    onClose: PropTypes.func.isRequired,
};

export default SimpleFormModal;
