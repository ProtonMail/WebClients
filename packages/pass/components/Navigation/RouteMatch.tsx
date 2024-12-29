import type { FC } from 'react';
import { memo, useMemo } from 'react';
import { Route } from 'react-router-dom';

export type RouteMatchProps = {
    exact?: boolean;
    active: boolean;
};

type Props<P extends object> = {
    path: string;
    component: FC<P & RouteMatchProps>;
} & P;

export const RouteMatch = <P extends object>({ path, component, ...props }: Props<P>) => {
    /** Memoize the wrapped component to prevent unnecessary re-renders */
    const RouteComponent = useMemo(() => memo(component), [component]);

    return (
        <Route path={path}>
            {({ match }) => <RouteComponent active={match !== null} exact={match?.isExact} {...(props as P)} />}
        </Route>
    );
};
