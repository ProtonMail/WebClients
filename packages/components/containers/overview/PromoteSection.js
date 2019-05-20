import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { CYCLE } from 'proton-shared/lib/constants';
import { Link } from 'react-router-dom';

const Panel = ({ model }) => {
    return (
        <div className="bg-global-altgrey color-white p1 mb1">
            <div className="flex-autogrid onmobile-flex-column w100">
                <div className="flex-autogrid-item flex flex-column flex-spacebetween">
                    <h4>{model.title}</h4>
                    <div className="mb2">{model.text}</div>
                    <div>
                        {model.action ? (
                            <Link className="pm-button pm-button--primary" to={model.link}>
                                {model.action}
                            </Link>
                        ) : (
                            <div className="p1" />
                        )}
                    </div>
                </div>
                <div className="flex-autogrid-item">
                    <img src={model.image} alt={model.title} />
                </div>
            </div>
        </div>
    );
};

Panel.propTypes = {
    model: PropTypes.object.isRequired
};

const PromoteSection = ({ subscription, user }) => {
    const MODELS = {
        member: {
            title: c('Title').t`Need help?`,
            text: c('Info').t`Reach out to your system admnistrator for further assistance and support`,
            link: '',
            image: '',
            action: c('Action').t`Need help?`
        },
        free: {
            title: c('Title').t``,
            text: c('Info').t``,
            link: '',
            image: '',
            action: c('Action').t`Upgrade`
        },
        pay: {
            title: c('Title').t`Thanks for your support`,
            text: c('Info').t`Help us improve our service by applying to our Beta programs.`,
            link: '',
            image: '',
            action: c('Action').t`Apply`
        },
        payMonthly: {
            title: c('Title').t`Get 20% discount`,
            text: c('Info').t`Pay for both ProtonMail and ProtonVPN and get 20% off your entire subscription.`,
            link: '',
            image: '',
            action: c('Action').t`Upgrade`
        }
    };

    if (user.isMember) {
        return <Panel model={MODELS.member} />;
    }

    if (user.isPaid) {
        if (subscription.Cycle === CYCLE.MONTHLY) {
            return <Panel model={MODELS.payMonthly} />;
        }

        return <Panel model={MODELS.pay} />;
    }

    return <Panel model={MODELS.free} />;
};

PromoteSection.propTypes = {
    subscription: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired
};

export default PromoteSection;
