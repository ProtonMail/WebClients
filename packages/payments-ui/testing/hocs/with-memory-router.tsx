import type { ComponentType } from 'react';
import { Router } from 'react-router';

import { createMemoryHistory } from 'history';

export const withMemoryRouter =
    (initialEntries?: string[]) =>
    <T extends {}>(Component: ComponentType<T>) => {
        const history = createMemoryHistory({ initialEntries });

        const MemoryRouterHoc = (props: T & JSX.IntrinsicAttributes) => {
            return (
                <Router history={history}>
                    <Component {...props} />
                </Router>
            );
        };

        MemoryRouterHoc.displayName = `withMemoryRouter(${Component.displayName || Component.name})`;

        return MemoryRouterHoc;
    };
