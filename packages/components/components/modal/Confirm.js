import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { ResetButton, PrimaryButton } from '../button';
import Modal from './Modal';
import Footer from './Footer';
import Content from './Content';

const Confirm = ({ title, onClose, onConfirm, children, cancel, confirm, loading }) => {
    return (
        <Modal onClose={onClose} title={title} type="small">
            <Content onSubmit={onConfirm} onReset={onClose} loading={loading}>
                {children}
                <Footer>
                    <ResetButton disabled={loading}>{cancel}</ResetButton>
                    <PrimaryButton type="submit" disabled={loading} autoFocus={true}>
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
    show: PropTypes.bool.isRequired,
    loading: PropTypes.bool
};

Confirm.defaultProps = {
    show: false,
    cancel: c('Action').t`Cancel`,
    confirm: c('Action').t`Confirm`,
    title: c('Action').t`Confirm`
};

export default Confirm;
