import { type FC } from 'react';
import { Route, Switch } from 'react-router-dom';

import { subPath } from '@proton/pass/components/Navigation/routing';

import { Breadcrumb } from './Breadcrumb';

export type BreadcrumbRoute = {
    active?: boolean;
    label: string;
    path: string;
    sub?: BreadcrumbRoute[];
};

export const BreadcrumbSwitch: FC<BreadcrumbRoute> = ({ active, label, path, sub }) => {
    return (
        <Route path={path}>
            {({ match: subMatch }) =>
                subMatch && (
                    <>
                        <Breadcrumb active={active ?? subMatch.isExact} label={label} to={path} />
                        {sub && (
                            <Switch>
                                {sub.map((child) => (
                                    <BreadcrumbSwitch
                                        key={child.path}
                                        active={child.active}
                                        label={child.label}
                                        path={subPath(subMatch.path, child.path)}
                                        sub={child.sub}
                                    />
                                ))}
                            </Switch>
                        )}
                    </>
                )
            }
        </Route>
    );
};
