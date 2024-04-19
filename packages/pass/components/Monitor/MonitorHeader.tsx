import { type FC } from 'react';
import { Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { c } from 'ttag';

import { Icon } from '@proton/components/index';
import { removeLocalPath, subPath } from '@proton/pass/components/Navigation/routing';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

const Breadcrumb: FC<{ active: boolean; label: string }> = ({ active, label }) => (
    <span className={clsx(active && 'text-semibold')}>{label}</span>
);

export const MonitorHeader: FC<RouteChildrenProps> = ({ match }) => {
    if (!match) return null;

    return (
        <div className="flex items-center gap-2 py-1">
            <Icon name="pass-shield-monitoring-ok" className="shrink-0" />
            <Breadcrumb active={match?.isExact ?? false} label={c('Title').t`${PASS_SHORT_APP_NAME} Monitor`} />
            <Switch>
                <Route path={subPath(match.path, '(duplicates|2fa|weak)')}>
                    {({ match: subMatch }) => {
                        if (!subMatch) return null;
                        return (
                            <>
                                <span className="mx-1">{'>'}</span>
                                <Breadcrumb
                                    active
                                    label={(() => {
                                        switch (removeLocalPath(subMatch.url)) {
                                            case 'monitor/duplicates':
                                                return c('Title').t`Reused passwords`;
                                            case 'monitor/weak':
                                                return c('Title').t`Insecure passwords`;
                                            case 'monitor/2fa':
                                                return c('Title').t`Missing 2FA`;
                                        }

                                        return '';
                                    })()}
                                />
                            </>
                        );
                    }}
                </Route>
            </Switch>
        </div>
    );
};
