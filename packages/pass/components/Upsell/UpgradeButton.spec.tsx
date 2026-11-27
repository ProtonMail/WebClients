import type { ReactElement } from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import { USER_ROLES } from '@proton/shared/lib/constants';

import { UpsellRef } from '../../constants';
import type { State } from '../../store/types';
import type { PassPlanResponse } from '../../types/api/pass';
import { PlanType } from '../../types/api/pass';
import { render } from '../../utils/tests/render';
import { UpgradeButton } from './UpgradeButton';
import { UpsellingModal } from './UpsellingModal';

const getUser = (Role: USER_ROLES, InternalName: string, Type = PlanType.PLUS): Partial<State['user']> => ({
    user: { Role } as State['user']['user'],
    plan: { InternalName, Type } as PassPlanResponse,
});

const renderWith = (ui: ReactElement, user: Partial<State['user']>) => {
    const onLink = vi.fn();
    render(ui, { state: { user }, core: { onLink } });
    return onLink;
};

const getOpenedURL = async (onLink: ReturnType<typeof vi.fn>) => {
    await waitFor(() => expect(onLink).toHaveBeenCalledTimes(1));
    return new URL(onLink.mock.calls[0][0], 'https://account.proton.test');
};

describe('UpgradeButton', () => {
    test.each([PLANS.PASS_BASIC, PLANS.PASS_PRO])('sends %s admins to the plan comparison', async (plan) => {
        const onLink = renderWith(
            <UpgradeButton upsellRef={UpsellRef.LIMIT_ALIAS} />,
            getUser(USER_ROLES.ADMIN_ROLE, plan)
        );

        fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));

        const url = await getOpenedURL(onLink);
        expect(url.pathname).toMatch(/\/pass\/dashboard$/);
        expect(url.searchParams.get('plan')).toBe(plan);
        expect(url.searchParams.get('target')).toBe('compare');
    });

    test('keeps an explicit plan for B2B admins', async () => {
        const onLink = renderWith(
            <UpgradeButton upsellRef={UpsellRef.LIMIT_ALIAS} plan={PLANS.PASS_BUSINESS} />,
            getUser(USER_ROLES.ADMIN_ROLE, PLANS.PASS_BASIC)
        );

        fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));

        const url = await getOpenedURL(onLink);
        expect(url.searchParams.get('plan')).toBe(PLANS.PASS_BUSINESS);
        expect(url.searchParams.get('target')).toBeNull();
    });

    test('points B2B members to their admin instead of opening the upgrade page', () => {
        const onLink = renderWith(
            <UpgradeButton upsellRef={UpsellRef.LIMIT_ALIAS} />,
            getUser(USER_ROLES.MEMBER_ROLE, PLANS.PASS_BASIC)
        );

        fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));

        expect(screen.getByText(/Contact your admin to gain access/)).toBeInTheDocument();
        expect(onLink).not.toHaveBeenCalled();
    });

    test('keeps the default upgrade page for individual plans', async () => {
        const onLink = renderWith(
            <UpgradeButton upsellRef={UpsellRef.LIMIT_ALIAS} />,
            getUser(USER_ROLES.ADMIN_ROLE, PLANS.PASS)
        );

        fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));

        const url = await getOpenedURL(onLink);
        expect(url.searchParams.get('plan')).toBeNull();
        expect(url.searchParams.get('target')).toBeNull();
    });
});

describe('UpsellingModal', () => {
    const renderModal = (user: Partial<State['user']>) =>
        renderWith(
            <UpsellingModal
                open
                upsellType="pass-monitor-business"
                upgradePath="pass/signup/business"
                upsellRef={UpsellRef.PASS_MONITOR}
            />,
            user
        );

    test('offers B2B admins an upgrade of their own plan, not Pass Plus', async () => {
        const onLink = renderModal(getUser(USER_ROLES.ADMIN_ROLE, PLANS.PASS_BASIC));

        expect(screen.getByText('Upgrade your plan')).toBeInTheDocument();
        expect(screen.queryByText(/Pass Plus|Pass Business/)).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));

        const url = await getOpenedURL(onLink);
        expect(url.pathname).toMatch(/\/pass\/dashboard$/);
        expect(url.searchParams.get('plan')).toBe(PLANS.PASS_BASIC);
    });

    test('asks B2B members to contact their admin', () => {
        renderModal(getUser(USER_ROLES.MEMBER_ROLE, PLANS.PASS_BASIC));

        expect(screen.getByText(/Contact your admin to gain access/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Upgrade|Get/ })).toBeNull();
    });

    test('keeps the Pass Monitor offer for individual plans', () => {
        renderModal(getUser(USER_ROLES.ADMIN_ROLE, PLANS.PASS, PlanType.PLUS));

        expect(screen.getByText('Stay safer online')).toBeInTheDocument();
    });
});
