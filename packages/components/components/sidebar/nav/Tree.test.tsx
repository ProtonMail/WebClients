import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import { IcBrandProtonVpnFilled } from '@proton/icons/icons/IcBrandProtonVpnFilled';
import { IcHouse } from '@proton/icons/icons/IcHouse';
import { IcUsers } from '@proton/icons/icons/IcUsers';
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
                    icon: IcHouse,
                    to: '/vpn/dashboard',
                    meta: {},
                    children: undefined,
                },
                {
                    id: 'organization.org-and-people',
                    label: 'Organization and people',
                    icon: IcUsers,
                    meta: { defaultOpen: true },
                    to: undefined,
                    children: [
                        {
                            id: 'organization.org-and-people.users',
                            label: 'Users',
                            to: '/vpn/users-addresses',
                            meta: {},
                            children: undefined,
                            icon: undefined,
                        },
                    ],
                },
                {
                    id: 'organization.vpn',
                    label: 'VPN',
                    icon: IcBrandProtonVpnFilled,
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
                        {
                            id: 'organization.vpn.always-on',
                            label: 'Always-on VPN',
                            to: '/vpn/always-on-vpn',
                            meta: { beta: true },
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
    const pathname = props.pathname ?? '/';
    return render(
        <MemoryRouter initialEntries={[pathname]}>
            <Tree routes={routes} pathname={pathname} {...props} />
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

    it('keeps the previous L1 branch open when pathname changes to a different section', () => {
        const { rerender } = renderTree({ pathname: '/vpn/dashboard' });
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');

        rerender(
            <MemoryRouter>
                <Tree routes={routes} pathname="/vpn/recovery" />
            </MemoryRouter>
        );

        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');
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

    it('leaves sibling L1 branches open when another one is opened manually', () => {
        renderTree({ pathname: '/vpn/recovery' });
        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');

        fireEvent.click(branch('Organization'));
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');
        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');
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
        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');
    });

    it('opens the target L1 branch without touching the section navigated away from', () => {
        const { rerender } = renderTree({ pathname: '/vpn/gateways' });
        expect(getBranch('VPN')).toHaveAttribute('data-state', 'open');

        rerender(
            <MemoryRouter>
                <Tree routes={routes} pathname="/vpn/recovery" />
            </MemoryRouter>
        );

        expect(getBranch('My account')).toHaveAttribute('data-state', 'open');
        expect(getBranch('Organization')).toHaveAttribute('data-state', 'open');
        expect(getBranch('VPN')).toHaveAttribute('data-state', 'open');
    });

    it('opens an L2 branch on mount when its meta marks it as default open', () => {
        renderTree({ pathname: '/vpn/dashboard' });
        expect(getBranch('Organization and people')).toHaveAttribute('data-state', 'open');
    });

    it('renders leaf icons with the color-weak class, so hover can light them up to full color', () => {
        renderTree({ pathname: '/' });
        const icon = screen.getByText('Home').closest('a')!.querySelector('svg')!;
        expect(icon).toHaveClass('color-weak');
    });

    it('renders branch icons with the color-weak class, so hover can light them up to full color', () => {
        renderTree({ pathname: '/' });
        const icon = branch('VPN').querySelector('svg')!;
        expect(icon).toHaveClass('color-weak');
    });

    it('marks the leaf matching the current pathname with aria-current="page"', () => {
        renderTree({ pathname: '/vpn/dashboard' });
        expect(screen.getByText('Home').closest('a')).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark leaves that do not match the current pathname', () => {
        renderTree({ pathname: '/vpn/dashboard' });
        expect(screen.getByText('Recovery').closest('a')).not.toHaveAttribute('aria-current');
    });

    it('badges a leaf whose meta marks it as beta', () => {
        renderTree({ pathname: '/vpn/gateways' });
        const leaf = screen.getByText('Always-on VPN').closest('a')!;
        expect(leaf.querySelector('[data-testid="beta-badge"]')).toHaveTextContent('Beta');
    });

    it('leaves non-beta items unbadged', () => {
        renderTree({ pathname: '/vpn/gateways' });
        const leaf = screen.getByText('Gateways').closest('a')!;
        expect(leaf.querySelector('[data-testid="beta-badge"]')).toBeNull();
    });
});
