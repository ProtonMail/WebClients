import { MemoryRouter, Route, Switch, useLocation } from 'react-router-dom';

import { render, screen } from '@testing-library/react';

import { extractSubscriptionSearchParams } from '@proton/payments/core/subscription/search-params';

import { CheckoutLinkRedirect, getCheckoutLinkRoutePath } from './CheckoutLinkRedirect';

const LocationProbe = () => {
    const { pathname, search, hash } = useLocation();
    return <div data-testid="location">{`${pathname}${search}${hash}`}</div>;
};

const renderAt = (url: string, pathPrefix?: string) => {
    render(
        <MemoryRouter initialEntries={[url]}>
            <Switch>
                <Route path={getCheckoutLinkRoutePath(pathPrefix)}>
                    <CheckoutLinkRedirect dashboardPath={`${pathPrefix ?? ''}/dashboard`} />
                </Route>
                <Route path="*">
                    <LocationProbe />
                </Route>
            </Switch>
        </MemoryRouter>
    );
    return screen.getByTestId('location').textContent;
};

describe('CheckoutLinkRedirect', () => {
    it('moves the plan from the path into the query and keeps the other params', () => {
        const location = renderAt('/checkout/bundle2022?cycle=12&coupon=BF2026BUNDLE&currency=USD');

        expect(location).toBe('/dashboard?cycle=12&coupon=BF2026BUNDLE&currency=USD&plan=bundle2022');
    });

    it('produces a query that the subscription link parser reads like the old format', () => {
        const location = renderAt('/checkout/bundle2022?cycle=12&coupon=BF2026BUNDLE&currency=USD');
        const search = location?.slice(location.indexOf('?')) ?? '';

        expect(extractSubscriptionSearchParams(search)).toEqual(
            extractSubscriptionSearchParams('?plan=bundle2022&cycle=12&coupon=BF2026BUNDLE&currency=USD')
        );
    });

    it('works without other params', () => {
        expect(renderAt('/checkout/vpn2024')).toBe('/dashboard?plan=vpn2024');
    });

    it('lets the plan in the path win over a plan in the query', () => {
        expect(renderAt('/checkout/vpn2024?plan=bundle2022&cycle=24')).toBe('/dashboard?plan=vpn2024&cycle=24');
    });

    it('keeps the hash', () => {
        expect(renderAt('/checkout/vpn2024?cycle=1#invoices')).toBe('/dashboard?cycle=1&plan=vpn2024#invoices');
    });

    it('sends an app-prefixed link to that app dashboard', () => {
        expect(renderAt('/mail/checkout/mail2022?cycle=12', '/mail')).toBe('/mail/dashboard?cycle=12&plan=mail2022');
    });

    it('leaves the old query format alone', () => {
        expect(renderAt('/dashboard?plan=bundle2022&cycle=12')).toBe('/dashboard?plan=bundle2022&cycle=12');
    });
});
