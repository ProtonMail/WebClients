import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { ResetButton, PrimaryButton } from '../button';
import Modal from './Modal';
import Footer from './Footer';
import Content from './Content';

/*
handleConfirm = () => {
    callAPI();
    this.setState({ showConfirm: false });
};

handleClose = () => {
    this.setState({ showConfirm: false });
};

<Confirm
    show={this.state.showConfirm}
    onClose={this.handleClose}
    title="Need to confirm"
    onConfirm={this.handleConfirm}>
    <p>Do you want to join our team?</p>
</Confirm>
*/

const Confirm = ({ title, show, onClose, onConfirm, children, cancel, confirm }) => {
    return (
        <Modal show={show} onClose={onClose} title={title} modalClassName="pm-modal--smaller">
            <Content onSubmit={onConfirm} onReset={onClose}>
                {children}
                <Footer>
                    <ResetButton>{cancel}</ResetButton>
                    <PrimaryButton type="submit" autoFocus={true}>
                        {confirm}
                    </PrimaryButton>
                </Footer>
            </Content>
        </Modal>
    );
};

Confirm.propTypes = {
    onClose: PropTypes.func,
    onConfirm: PropTypes.func,
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    cancel: PropTypes.string.isRequired,
    confirm: PropTypes.string.isRequired,
    show: PropTypes.bool.isRequired
};

Confirm.defaultProps = {
    show: false,
    cancel: c('Action').t`Cancel`,
    confirm: c('Action').t`Confirm`,
    title: c('Action').t`Confirm`
};

export default Confirm;
