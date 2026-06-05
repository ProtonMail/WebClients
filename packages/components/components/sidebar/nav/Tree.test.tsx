import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import type { SidebarTree } from '@proton/nav/types/sidebar';

import { Tree } from './Tree';

jest.mock('./animated', () => ({
    AnimatedChildren: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => (
        <div data-component="animated-children" data-state={isOpen ? 'open' : 'closed'} aria-hidden={!isOpen}>
            {children}
        </div>
    ),
}));

const routes: SidebarTree = {
    items: [
        {
            id: 'organization',
            label: 'Organization',
            meta: {},
            to: undefined,
            icon: undefined,
            children: [
                {
                    id: 'organization.home',
                    label: 'Home',
                    icon: 'house',
                    to: '/vpn/dashboard',
                    meta: {},
                    children: undefined,
                },
                {
                    id: 'organization.vpn',
                    label: 'VPN',
                    icon: 'brand-proton-vpn-filled',
                    meta: {},
                    to: undefined,
                    children: [
                        {
                            id: 'organization.vpn.gateways',
                            label: 'Gateways',
                            to: '/vpn/gateways',
                            meta: {},
                            children: undefined,
                            icon: undefined,
                        },
                        {
                            id: 'organization.vpn.shared-servers',
                            label: 'Shared servers',
                            to: '/vpn/shared-servers',
                            meta: {},
                            children: undefined,
                            icon: undefined,
                        },
                    ],
                },
            ],
        },
        {
            id: 'my-account',
            label: 'My account',
            to: undefined,
            meta: {},
            icon: undefined,
            children: [
                {
                    id: 'my-account.recovery',
                    label: 'Recovery',
                    to: '/vpn/recovery',
                    meta: {},
                    children: undefined,
                    icon: undefined,
                },
            ],
        },
    ],
};

function renderTree(props: Partial<React.ComponentProps<typeof Tree>> = {}) {
    return render(
        <MemoryRouter>
            <Tree routes={routes} pathname="/" {...props} />
        </MemoryRouter>
    );
}

function branch(label: string) {
    return screen.getByText(label).closest('button')!;
}

function getBranch(label: string) {
    return screen
        .getByText(label)
        .closest('[data-sidebar-depth]')!
        .querySelector(':scope > [data-component="animated-children"]')!;
}

describe('Tree', () => {
    it('opens the L1 branch that contains the active leaf on mount', () => {
        renderTree({ pathname: '/vpn/recovery' });
        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'closed');
    });

    it('opens the correct L1 branch for a deeply nested leaf', () => {
        renderTree({ pathname: '/vpn/gateways' });
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');
        expect(getBranch('My account')).toHaveAttribute('data-state', 'closed');
    });

    it('opens the L2 branch that contains the active leaf', () => {
        renderTree({ pathname: '/vpn/gateways' });
        expect(getBranch('VPN')).toHaveAttribute('data-state', 'open');
    });

    it('does not open an unrelated L2 branch', () => {
        renderTree({ pathname: '/vpn/dashboard' });
        expect(getBranch('VPN')).toHaveAttribute('data-state', 'closed');
    });

    it('collapses the previous L1 branch when pathname changes to a different section', () => {
        const { rerender } = renderTree({ pathname: '/vpn/dashboard' });
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');

        rerender(
            <MemoryRouter>
                <Tree routes={routes} pathname="/vpn/recovery" />
            </MemoryRouter>
        );

        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'closed');
    });

    it('keeps L1 open when navigating between leaves in the same section', () => {
        const { rerender } = renderTree({ pathname: '/vpn/dashboard' });
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');

        rerender(
            <MemoryRouter>
                <Tree routes={routes} pathname="/vpn/gateways" />
            </MemoryRouter>
        );

        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');
    });

    it('falls back gracefully when pathname matches no leaf', () => {
        renderTree({ pathname: '/unknown' });
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'closed');
        expect(getBranch('My account')).toHaveAttribute('data-state', 'closed');
    });

    it('still allows manual toggle of L1 branches', () => {
        renderTree({ pathname: '/vpn/recovery' });
        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');

        fireEvent.click(branch('Organization'));
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');
        expect(getBranch('My account')).toHaveAttribute('data-state', 'closed');
    });

    it('closes an open L1 branch when clicked again', () => {
        renderTree({ pathname: '/vpn/dashboard' });
        fireEvent.click(branch('Organization'));
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'closed');
    });

    it('opens the L2 branch when navigating from a different L1 section', () => {
        const { rerender } = renderTree({ pathname: '/vpn/recovery' });
        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');

        rerender(
            <MemoryRouter>
                <Tree routes={routes} pathname="/vpn/gateways" />
            </MemoryRouter>
        );

        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');
        expect(getBranch('VPN')).toHaveAttribute('data-state', 'open');
        expect(getBranch('My account')).toHaveAttribute('data-state', 'closed');
    });

    it('closes the L2 branch when navigating away to a leaf that does not need it open', () => {
        const { rerender } = renderTree({ pathname: '/vpn/gateways' });
        expect(getBranch('VPN')).toHaveAttribute('data-state', 'open');

        rerender(
            <MemoryRouter>
                <Tree routes={routes} pathname="/vpn/recovery" />
            </MemoryRouter>
        );

        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'closed');
    });
});
