import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Href } from 'react-components';
import { c } from 'ttag';
import { getListUnsubscribe } from '../../../helpers/message';

const ExtraUnsubscribe = ({ message }) => {
    if (/*unsubscribed || */ !getListUnsubscribe(message.data)) {
        return null;
    }

    return (
        <div className="bg-white rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
            <Icon name="email" className="flex-item-noshrink fill-global-grey mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{c('Info').t`This message is from a mailing list`}</span>
            <span className="flex-item-noshrink flex">
                <Href
                    className="bold mr1 pl0-5 pr0-5"
                    href="https://protonmail.com/support/knowledge-base/auto-unsubscribe"
                >
                    {c('Info').t`Learn more`}
                </Href>
                <a className="bold">{c('Action').t`Unsubscribe`}</a>
            </span>
        </div>
    );
};

ExtraUnsubscribe.propTypes = {
    message: PropTypes.object.isRequired
};

export default ExtraUnsubscribe;
