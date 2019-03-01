import React from 'react';
import { Modal } from 'react-components';

const DomainModal = ({ show, onClose }) => {
    return (
        <Modal show={show} onClose={onClose}>
            domain form
        </Modal>
    );
};

export default DomainModal;
