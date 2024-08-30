import { type FC } from 'react';
import { type RouteChildrenProps, Switch } from 'react-router-dom';

import { c } from 'ttag';

import { Icon } from '@proton/components';
import { Breadcrumb } from '@proton/pass/components/Layout/Breadcrumbs/Breadcrumb';
import { type BreadcrumbRoute, BreadcrumbSwitch } from '@proton/pass/components/Layout/Breadcrumbs/BreadcrumbSwitch';
import { getLocalPath, subPath } from '@proton/pass/components/Navigation/routing';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

const getMonitorBreadcrumbs = (): BreadcrumbRoute[] => [
    { path: 'duplicates', label: c('Title').t`Reused passwords`, active: true },
    { path: 'weak', label: c('Title').t`Weak passwords`, active: true },
    { path: '2fa', label: c('Title').t`Inactive 2FA`, active: true },
    { path: 'excluded', label: c('Title').t`Excluded items`, active: true },
    {
        path: 'dark-web',
        label: c('Title').t`Dark Web Monitoring`,
        sub: [
            { path: 'custom', label: c('Title').t`Custom addresses` },
            { path: 'alias', label: c('Title').t`Hide-my-email aliases` },
            { path: 'proton', label: c('Title').t`${BRAND_NAME} addresses` },
        ],
    },
];

export const MonitorHeader: FC<RouteChildrenProps> = ({ match }) => {
    return (
        match && (
            <div className="flex items-center gap-1 py-1">
                <Icon name="pass-shield-monitoring-ok" className="shrink-0" />
                <Breadcrumb
                    first
                    active={match?.isExact ?? false}
                    label={c('Title').t`${PASS_SHORT_APP_NAME} Monitor`}
                    to={getLocalPath('monitor')}
                />
                <Switch>
                    {getMonitorBreadcrumbs().map((breadcrumb) => (
                        <BreadcrumbSwitch
                            key={breadcrumb.path}
                            active={breadcrumb.active}
                            label={breadcrumb.label}
                            path={subPath(match.path, breadcrumb.path)}
                            sub={breadcrumb.sub}
                        />
                    ))}
                </Switch>
            </div>
        )
    );
};
