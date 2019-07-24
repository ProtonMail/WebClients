import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { CYCLE } from 'proton-shared/lib/constants';
import { Link } from 'react-router-dom';
import thanksForYourSupportSvg from 'design-system/assets/img/pm-images/settings-illustrations_thanks-for-your-support.svg';
import contactYourAdminSvg from 'design-system/assets/img/pm-images/settings-illustrations_contact-your-admin.svg';
import upgradeToPaidPlanSvg from 'design-system/assets/img/pm-images/settings-illustrations_upgrade-to-paid-plan.svg';
import get20PerscentDiscountSvg from 'design-system/assets/img/pm-images/settings-illustrations_get-20-percent-discount.svg';

const Panel = ({ model }) => {
    return (
        <div className="rounded bg-global-altgrey color-white p1 mb1 flex">
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
                <div className="flex-autogrid-item flex flex-column flex-items-end">
                    <img className="h100" src={model.image} alt={model.title} />
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
            text: c('Info').t`Reach out to your system administrator for further assistance and support`,
            image: contactYourAdminSvg
        },
        free: {
            title: c('Title').t`Upgrade to a paid plan`,
            text: c('Info').t`Get additional storage capacity and more addresses with ProtonMail Plus.`,
            link: '/settings/subscription',
            image: upgradeToPaidPlanSvg,
            action: c('Action').t`Upgrade ProtonMail`
        },
        pay: {
            title: c('Title').t`Thanks for your support`,
            text: c('Info')
                .t`Help us improve our service and get early access to new features by enrolling in our Beta programs.`,
            link: '',
            image: thanksForYourSupportSvg,
            action: c('Action').t`Join`
        },
        payMonthly: {
            title: c('Title').t`Get 20% discount`,
            text: c('Info').t`Pay for both ProtonMail and ProtonVPN and get 20% off your entire subscription.`,
            link: '',
            image: get20PerscentDiscountSvg,
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
