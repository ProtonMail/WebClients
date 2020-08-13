import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import thanksForYourSupportSvg from 'design-system/assets/img/pm-images/love.svg';
import contactYourAdminSvg from 'design-system/assets/img/pm-images/settings.svg';
import upgradeToPaidPlanSvg from 'design-system/assets/img/pm-images/upgrade.svg';
import get20PerscentDiscountSvg from 'design-system/assets/img/pm-images/percent.svg';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';
import { APPS } from 'proton-shared/lib/constants';
import { AppLink } from '../../components';

const Panel = ({ model }) => {
    return (
        <div className="rounded bg-global-altgrey color-white p1 mb1 flex">
            <div className="flex-autogrid onmobile-flex-column w100">
                <div className="flex-autogrid-item flex flex-column flex-spacebetween">
                    <h4>{model.title}</h4>
                    <div className="mb2">{model.text}</div>
                    <div>
                        {model.action && model.to ? (
                            <AppLink className="pm-button inbl pm-button--primary" to={model.to} toApp={model.toApp}>
                                {model.action}
                            </AppLink>
                        ) : (
                            <div className="p1" />
                        )}
                    </div>
                </div>
                <div className="flex-autogrid-item flex flex-column flex-items-end">
                    <img className="h100" src={model.image} alt={model.title} style={{ maxHeight: '200px' }} />
                </div>
            </div>
        </div>
    );
};

Panel.propTypes = {
    model: PropTypes.object.isRequired,
};

const PromoteSection = ({ user }) => {
    const { isPaid, hasPaidMail, hasPaidVpn, isMember } = user;
    const MODELS = {
        member: {
            title: c('Title').t`Need help?`,
            text: c('Info').t`Reach out to your system administrator for further assistance and support`,
            image: contactYourAdminSvg,
        },
        free: {
            title: c('Title').t`Upgrade to a paid plan`,
            text: c('Info').t`Get additional storage capacity and more addresses with ProtonMail Plus.`,
            to: '/subscription',
            toApp: getAccountSettingsApp(),
            image: upgradeToPaidPlanSvg,
            action: c('Action').t`Upgrade ProtonMail`,
        },
        pay: {
            title: c('Title').t`Thanks for your support`,
            text: c('Info')
                .t`Help us improve our service and get early access to new features by enrolling in our Beta programs.`,
            to: '/apps',
            toApp: APPS.PROTONMAIL_SETTINGS,
            image: thanksForYourSupportSvg,
            action: c('Action').t`Join`,
        },
        payBundle: {
            title: c('Title').t`Get 20% discount`,
            text: c('Info').t`Pay for both ProtonMail and ProtonVPN and get 20% off your entire subscription.`,
            to: '/subscription',
            toApp: getAccountSettingsApp(),
            image: get20PerscentDiscountSvg,
            action: c('Action').t`Upgrade`,
        },
    };

    if (isMember) {
        return <Panel model={MODELS.member} />;
    }

    if ((hasPaidMail && !hasPaidVpn) || (!hasPaidMail && hasPaidVpn)) {
        return <Panel model={MODELS.payBundle} />;
    }

    if (isPaid) {
        return <Panel model={MODELS.pay} />;
    }

    return <Panel model={MODELS.free} />;
};

PromoteSection.propTypes = {
    user: PropTypes.object.isRequired,
};

export default PromoteSection;
