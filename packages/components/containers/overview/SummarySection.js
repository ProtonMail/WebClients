import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { USER_ROLES } from 'proton-shared/lib/constants';

const { MEMBER_ROLE, ADMIN_ROLE } = USER_ROLES;

import { formatPlans } from '../payments/subscription/helpers';

const Rows = ({ subscription, user }) => {
    const { mailPlan, vpnPlan } = formatPlans(subscription.Plans);

    if (user.hasPaidMail && mailPlan.Name === 'visionary') {
        return (
            <div className="flex-autogrid onmobile-flex-column w100">
                <div className="flex-autogrid-item">ProtonMail plan</div>
                <div className="flex-autogrid-item bold">Visionary</div>
                <div className="flex-autogrid-item alignright">
                    <Link to="/settings/subscription">{c('Link').t`Manage`}</Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex-autogrid onmobile-flex-column w100 mb1">
                <div className="flex-autogrid-item">ProtonMail plan</div>
                <div className="flex-autogrid-item bold capitalize">
                    {user.hasPaidMail ? mailPlan.Name : c('Plan').t`Free`}
                </div>
                <div className="flex-autogrid-item alignright">
                    <Link to="/settings/subscription">{c('Link').t`Manage`}</Link>
                </div>
            </div>
            <div className="flex-autogrid onmobile-flex-column w100">
                <div className="flex-autogrid-item">ProtonVPN plan</div>
                <div className="flex-autogrid-item bold capitalize">
                    {user.hasPaidVpn ? vpnPlan.Name : c('Plan').t`Free`}
                </div>
                <div className="flex-autogrid-item alignright">
                    <Link to="/settings/subscription">{c('Link').t`Manage`}</Link>
                </div>
            </div>
        </>
    );
};

Rows.propTypes = {
    subscription: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired
};

const SummarySection = ({ subscription, user, userSettings }) => {
    const ROLES = {
        [MEMBER_ROLE]: c('Role').t`Member`,
        [ADMIN_ROLE]: c('Role').t`Administrator`
    };
    return (
        <div className="shadow-container mb1">
            <div className="p1">
                <div className="flex-autogrid onmobile-flex-column w100 mb1">
                    <div className="flex-autogrid-item">{c('Label').t`Username`}</div>
                    <div className="flex-autogrid-item bold">{user.Name}</div>
                    <div className="flex-autogrid-item" />
                </div>
                <div className="flex-autogrid onmobile-flex-column w100 mb1">
                    <div className="flex-autogrid-item">{c('Label').t`Recovery email`}</div>
                    <div className="flex-autogrid-item bold">
                        {userSettings.Email.Status ? c('Status').t`Active` : c('Status').t`Not set`}
                    </div>
                    <div className="flex-autogrid-item alignright">
                        <Link to="/settings/account">{c('Link').t`Edit`}</Link>
                    </div>
                </div>
                <div className="flex-autogrid onmobile-flex-column w100 mb1">
                    <div className="flex-autogrid-item">{c('Label').t`Two factor authentication`}</div>
                    <div className="flex-autogrid-item bold">
                        {userSettings['2FA'].Enabled ? c('Status').t`Enabled` : c('Status').t`Disabled`}
                    </div>
                    <div className="flex-autogrid-item alignright">
                        <Link to="/settings/account">{c('Link').t`Edit`}</Link>
                    </div>
                </div>
                <Rows subscription={subscription} user={user} />
                {subscription.MaxMembers > 1 ? (
                    <div className="flex-autogrid onmobile-flex-column w100 mb1">
                        <div className="flex-autogrid-item">{c('Label').t`Role`}</div>
                        <div className="flex-autogrid-item bold">{ROLES[user.Role]}</div>
                        <div className="flex-autogrid-item" />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

SummarySection.propTypes = {
    subscription: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    userSettings: PropTypes.object.isRequired
};

export default SummarySection;
