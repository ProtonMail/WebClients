import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Breadcrumbs } from './Breadcrumbs';

jest.mock('@proton/components/index', () => {
    const ReactMock = require('react');
    return {
        CollapsingBreadcrumbs: ({ breadcrumbs }: { breadcrumbs: any[] }) =>
            ReactMock.createElement(
                ReactMock.Fragment,
                null,
                ...breadcrumbs.map((b: any) =>
                    ReactMock.createElement('button', { key: b.key, onClick: b.onClick }, b.text)
                )
            ),
        Loader: () => ReactMock.createElement('div', null, 'Loading'),
        useNotifications: () => ({ createNotification: jest.fn() }),
    };
});

jest.mock('../../components/SignatureIcon', () => ({
    SignatureIcon: () => null,
}));

const makeCrumb = (uid: string, name: string) => ({
    uid,
    name,
    haveSignatureIssues: false,
    supportDropOperations: false,
});

describe('Breadcrumbs', () => {
    const onBreadcrumbItemClick = jest.fn();
    const events = { onBreadcrumbItemClick };
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not call onBreadcrumbItemClick when the last crumb is clicked', async () => {
        const crumbs = [makeCrumb('root', 'Root'), makeCrumb('folder', 'Folder'), makeCrumb('last', 'Last')];
        render(React.createElement(Breadcrumbs, { loading: false, crumbs, events }));

        await user.click(screen.getByText('Last'));

        expect(onBreadcrumbItemClick).not.toHaveBeenCalled();
    });

    it('calls onBreadcrumbItemClick with the correct uid when a non-last crumb is clicked', async () => {
        const crumbs = [makeCrumb('root', 'Root'), makeCrumb('folder', 'Folder'), makeCrumb('last', 'Last')];
        render(React.createElement(Breadcrumbs, { loading: false, crumbs, events }));

        await user.click(screen.getByText('Root'));
        expect(onBreadcrumbItemClick).toHaveBeenCalledWith('root');

        await user.click(screen.getByText('Folder'));
        expect(onBreadcrumbItemClick).toHaveBeenCalledWith('folder');

        expect(onBreadcrumbItemClick).toHaveBeenCalledTimes(2);
    });

    it('does not call onBreadcrumbItemClick when there is only one crumb', async () => {
        const crumbs = [makeCrumb('root', 'Root')];
        render(React.createElement(Breadcrumbs, { loading: false, crumbs, events }));

        await user.click(screen.getByText('Root'));

        expect(onBreadcrumbItemClick).not.toHaveBeenCalled();
    });
});
