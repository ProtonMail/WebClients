import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { USER_ROLES, PLANS } from 'proton-shared/lib/constants';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import { formatPlans } from '../payments/subscription/helpers';
import { AppLink } from '../../components';

const { MEMBER_ROLE, ADMIN_ROLE } = USER_ROLES;

const Rows = ({ subscription, user }) => {
    const { mailPlan = {}, vpnPlan = {} } = formatPlans(subscription.Plans);

    return (
        <>
            <div className="flex-autogrid onmobile-flex-column flex-items-center w100 mb1">
                <div className="flex-autogrid-item">ProtonMail plan</div>
                <div className="flex-autogrid-item bold capitalize">
                    {user.hasPaidMail ? mailPlan.Name : c('Plan').t`Free`}
                </div>
                <div className="flex-autogrid-item alignright">
                    <AppLink to="/subscription" toApp={getAccountSettingsApp()}>{c('Link').t`Manage`}</AppLink>
                </div>
            </div>
            {mailPlan.Name === PLANS.VISIONARY ? null : (
                <div className="flex-autogrid onmobile-flex-column w100">
                    <div className="flex-autogrid-item">ProtonVPN plan</div>
                    <div className="flex-autogrid-item bold capitalize">
                        {user.hasPaidVpn ? vpnPlan.Name : c('Plan').t`Free`}
                    </div>
                    <div className="flex-autogrid-item alignright">
                        <AppLink to="/subscription" toApp={getAccountSettingsApp()}>{c('Link').t`Manage`}</AppLink>
                    </div>
                </div>
            )}
        </>
    );
};

Rows.propTypes = {
    subscription: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
};

const SummarySection = ({ subscription, user, userSettings }) => {
    const ROLES = {
        [MEMBER_ROLE]: c('Role').t`Member`,
        [ADMIN_ROLE]: c('Role').t`Administrator`,
    };

    return (
        <div className="flex-item-fluid rounded shadow-container mb1">
            <div className="p1">
                <div className="flex-autogrid onmobile-flex-column w100 mb1">
                    <div className="flex-autogrid-item">{c('Label').t`Username`}</div>
                    <div className="flex-autogrid-item bold ellipsis" title={user.Name}>
                        {user.Name}
                    </div>
                    <div className="flex-autogrid-item" />
                </div>
                <div className="flex-autogrid onmobile-flex-column w100 mb1">
                    <div className="flex-autogrid-item">{c('Label').t`Recovery email`}</div>
                    <div className="flex-autogrid-item bold ellipsis" title={userSettings.Email.Value}>
                        {userSettings.Email.Value || c('Status').t`Not set`}
                    </div>
                    <div className="flex-autogrid-item alignright">
                        <AppLink to="/account" toApp={getAccountSettingsApp()}>{c('Link').t`Edit`}</AppLink>
                    </div>
                </div>
                <div className="flex-autogrid onmobile-flex-column w100 mb1">
                    <div className="flex-autogrid-item">{c('Label').t`Two factor authentication`}</div>
                    <div className="flex-autogrid-item bold">
                        {userSettings['2FA'].Enabled ? c('Status').t`Enabled` : c('Status').t`Disabled`}
                    </div>
                    <div className="flex-autogrid-item alignright">
                        <AppLink to="/account" toApp={getAccountSettingsApp()}>{c('Link').t`Edit`}</AppLink>
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
    userSettings: PropTypes.object.isRequired,
};

export default SummarySection;
