import React from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';

import { Button, PrimaryButton } from '../button';
import Modal from './Modal';
import Header from './Header';
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
        <Modal show={show} className="confirm-modal" onClose={onClose}>
            <Header onClose={onClose}>{title}</Header>
            <Content onSubmit={onConfirm} onReset={onClose}>
                {children}
                <Footer className="flex flex-spacebetween">
                    <Button type="reset">{cancel}</Button>
                    <PrimaryButton type="submit">{confirm}</PrimaryButton>
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
    cancel: t`Cancel`,
    confirm: t`Confirm`,
    title: t`Confirm`
};

export default Confirm;