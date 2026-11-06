import { CYCLE, PLANS } from '@proton/payments/core/constants';

import { SignupMode } from '../single-signup-v2/interface';
import { getSignupParameters } from '../single-signup-v2/signupParameters';
import type { SignupProvisioning } from './orgProvisioning';
import {
    InvalidProvisioningLinkError,
    ProvisioningPaymentMethod,
    getProvisionedDeal,
    resolveProvisioning,
} from './orgProvisioning';

const TOKEN = 'a'.repeat(48);

const provisioning: SignupProvisioning = {
    OrganizationName: 'NewCo AG',
    AdminDisplayName: 'Aleksa',
    AdminEmail: 'aleksa@newco.example',
    BillingAddress: { CountryCode: 'CH', State: null, ZipCode: '1228', City: 'Plan-les-Ouates' },
    InvoiceEmail: '',
    Taxable: true,
    PaymentMethod: ProvisioningPaymentMethod.BankTransfer,
    PaymentTermsDays: 30,
};

const HASH = `#provisioningToken=${TOKEN}`;

const getParameters = (search: string, hash = HASH, partner?: 'porkbun', pathname = '/mail/signup/business') =>
    getSignupParameters({
        visionarySignupEnabled: false,
        location: { pathname, search, state: {}, hash },
        partner,
    });

describe('provisioning signup link', () => {
    it('turns the token into a provisioning invite on a fresh session', () => {
        const parameters = getParameters('?plan=bundlepro2024&coupon=HINT');

        expect(parameters.invite).toEqual({ type: 'provisioning', data: { token: TOKEN } });
        expect(parameters.mode).toBe(SignupMode.Invite);
        expect(parameters.localID).toBe(-1);
        expect(parameters.noPromo).toBe(true);
    });

    it('reads a VPN deal on the /vpn path, plan and dedicated servers included', () => {
        const parameters = getParameters(
            '?plan=vpnbiz2023&cycle=12&users=6&ips=2',
            HASH,
            undefined,
            '/vpn/signup/business'
        );

        expect(parameters.invite).toEqual({ type: 'provisioning', data: { token: TOKEN } });
        expect(parameters).toMatchObject({ preSelectedPlan: PLANS.VPN_BUSINESS, users: 6, ips: 2 });
    });

    it('reads the plan side of the deal from the query params', () => {
        const parameters = getParameters('?plan=bundlepro2024&cycle=12&currency=chf&users=25&domains=20&coupon=org_10');

        expect(parameters).toMatchObject({
            preSelectedPlan: PLANS.BUNDLE_PRO_2024,
            cycle: CYCLE.YEARLY,
            currency: 'CHF',
            users: 25,
            domains: 20,
            coupon: 'ORG_10',
        });
    });

    it('leaves the porkbun token alone', () => {
        const parameters = getParameters(`?token=${TOKEN}`, HASH, 'porkbun');

        expect(parameters.invite?.type).not.toBe('provisioning');
    });

    it('is a regular signup without a token', () => {
        expect(getParameters('?plan=bundlepro2024', '').invite).toBeUndefined();
    });

    it('ignores a generic token query param', () => {
        expect(getParameters(`?token=${TOKEN}&plan=bundlepro2024`, '').invite).toBeUndefined();
    });
});

describe('resolveProvisioning', () => {
    it('returns the negotiated configuration', async () => {
        const api = jest.fn().mockResolvedValue({ Provisioning: provisioning });

        await expect(resolveProvisioning(api, TOKEN)).resolves.toBe(provisioning);
        expect(api).toHaveBeenCalledWith(
            expect.objectContaining({ method: 'get', url: expect.stringContaining(TOKEN) })
        );
    });

    it('keeps a crafted token inside the lookup path', async () => {
        const api = jest.fn().mockResolvedValue({ Provisioning: provisioning });

        await resolveProvisioning(api, '../../some/endpoint?x=');

        expect(api).toHaveBeenCalledWith(
            expect.objectContaining({ url: 'core/v4/org-provisioning/..%2F..%2Fsome%2Fendpoint%3Fx%3D' })
        );
    });

    it.each([404, 422])('reports an unusable link on %s', async (status) => {
        const api = jest.fn().mockRejectedValue({ status, data: { Code: 2501, Error: 'Not found' } });

        await expect(resolveProvisioning(api, TOKEN)).rejects.toBeInstanceOf(InvalidProvisioningLinkError);
    });

    it('passes other failures through, so they are not shown as an expired link', async () => {
        const api = jest.fn().mockRejectedValue({ status: 500 });

        await expect(resolveProvisioning(api, TOKEN)).rejects.not.toBeInstanceOf(InvalidProvisioningLinkError);
    });
});

describe('getProvisionedDeal', () => {
    const urlParams = {
        orgName: 'URL Org',
        firstName: 'Jane',
        lastName: 'Doe',
        vatNumber: 'CHE-URL',
        streetAddress: 'URL street 1',
        city: 'URL city',
    };

    it('reads the fields the link carries from the link', () => {
        const { details } = getProvisionedDeal({ token: TOKEN, provisioning, urlParams });

        expect(details).toMatchObject({
            OrganizationName: 'URL Org',
            BillingAddress: {
                FirstName: 'Jane',
                LastName: 'Doe',
                Address: 'URL street 1',
                City: 'URL city',
                VatId: 'CHE-URL',
            },
        });
    });

    it('reads the rest, and what the link left empty, from the lookup', () => {
        const { details } = getProvisionedDeal({
            token: TOKEN,
            provisioning: { ...provisioning, BillingAddress: { ...provisioning.BillingAddress, VatId: 'CHE-STORED' } },
            urlParams: {},
        });

        expect(details).toMatchObject({
            OrganizationName: 'NewCo AG',
            BillingAddress: { CountryCode: 'CH', ZipCode: '1228', City: 'Plan-les-Ouates', VatId: 'CHE-STORED' },
            PaymentMethod: ProvisioningPaymentMethod.BankTransfer,
            PaymentTermsDays: 30,
        });
    });

    it('puts the link params and the lookup together once', () => {
        const deal = getProvisionedDeal({
            token: TOKEN,
            provisioning: {
                ...provisioning,
                BillingAddress: { ...provisioning.BillingAddress, ZipCode: '', VatId: 'CHE123' },
            },
            urlParams: { firstName: 'Ada' },
        });

        expect(deal).toMatchObject({
            token: TOKEN,
            details: { OrganizationName: 'NewCo AG', BillingAddress: { FirstName: 'Ada' } },
            // Payments takes null for an absent postal code; the VAT id travels on its own.
            billingAddress: { CountryCode: 'CH', ZipCode: null },
            vatNumber: 'CHE123',
            isBankTransfer: true,
        });
        expect(deal.billingAddress).not.toHaveProperty('VatId');
    });

    it('is not a bank transfer deal when paid by card', () => {
        const deal = getProvisionedDeal({
            token: TOKEN,
            provisioning: { ...provisioning, PaymentMethod: ProvisioningPaymentMethod.Card },
            urlParams: {},
        });

        expect(deal.isBankTransfer).toBe(false);
    });
});
