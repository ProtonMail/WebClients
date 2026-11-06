import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { getFlagSvg } from '@proton/components/components/v2/phone/flagSvgs';
import { planOffersAddonAtSignup } from '@proton/payments/core/addon/addons';
import { ADDON_PREFIXES, type CYCLE } from '@proton/payments/core/constants';
import { getCountryByAbbrMap } from '@proton/payments/core/countries';
import type { Currency, PlanIDs } from '@proton/payments/core/interface';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { getPlanNameFromIDs } from '@proton/shared/lib/payments/plan/helpers';
import type { PlansMap } from '@proton/shared/lib/payments/plan/interface';

import type { SignupProvisioning } from '../signup/orgProvisioning';
import { ProvisioningPaymentMethod } from '../signup/orgProvisioning';
import BoxContent from './BoxContent';
import BoxHeader from './BoxHeader';

/*
 * Read-only sections of a sales-provisioned signup. Everything here was negotiated with the sales
 * representative and is applied as is, so nothing is editable.
 */

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-nowrap gap-4 py-2">
        <span className="text-semibold w-custom shrink-0" style={{ '--w-custom': '10rem' }}>
            {label}
        </span>
        <span className="text-break">{children}</span>
    </div>
);

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="mb-8">
        <h3 className="text-lg text-semibold mb-2">{title}</h3>
        {children}
    </div>
);

const CountryValue = ({ countryCode }: { countryCode: string }) => {
    const flag = getFlagSvg(countryCode);

    return (
        <span className="inline-flex flex-nowrap items-center gap-2">
            {flag && <img alt="" src={flag} width={20} height={14} />}
            {getCountryByAbbrMap()[countryCode] ?? countryCode}
        </span>
    );
};

const getPaymentTermsLabel = (days: number) =>
    days === 0
        ? c('Payment terms').t`Due on receipt`
        : c('Payment terms').ngettext(msgid`${days} day`, `${days} days`, days);

const getPaymentMethodLabel = (method: ProvisioningPaymentMethod) =>
    method === ProvisioningPaymentMethod.Card
        ? c('Payment method').t`Credit card`
        : c('Payment method').t`Bank transfer`;

interface Props {
    provisioning: SignupProvisioning;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    cycle: CYCLE;
    currency: Currency;
    /** Step number of "Plan details"; "Billing details" takes the next one. */
    step: number;
}

export const ProvisioningDetails = ({ provisioning, planIDs, plansMap, cycle, currency, step }: Props) => {
    const { BillingAddress, InvoiceEmail, Taxable, PaymentMethod, PaymentTermsDays } = provisioning;
    // Totals, not addon counts: what the organization gets, including what the plan comes with.
    const selectedPlan = new SelectedPlan(planIDs, plansMap, cycle, currency);
    const domains = selectedPlan.getTotalDomains();
    const vpnServers = selectedPlan.getTotalIPs();
    // Rows only for addons the plan sells; amounts a plan bundles but can't add to stay hidden.
    const planName = getPlanNameFromIDs(planIDs);
    const showDomains = !!planName && planOffersAddonAtSignup(planName, ADDON_PREFIXES.DOMAIN);
    const showVpnServers = !!planName && planOffersAddonAtSignup(planName, ADDON_PREFIXES.IP);
    const contact = [BillingAddress.FirstName, BillingAddress.LastName].filter(Boolean).join(' ');
    const address = [
        BillingAddress.Address,
        [BillingAddress.ZipCode, BillingAddress.City].filter(Boolean).join(' '),
        BillingAddress.State,
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <>
            <BoxHeader step={step} title={c('Header').t`Plan details`} />
            <BoxContent>
                <Row label={c('Label').t`Organization size`}>{selectedPlan.getTotalUsers()}</Row>
                {showDomains && <Row label={c('Label').t`Custom email domains`}>{domains}</Row>}
                {showVpnServers && <Row label={c('Label').t`Dedicated VPN servers`}>{vpnServers}</Row>}
            </BoxContent>

            <div className="mt-12">
                <BoxHeader step={step + 1} title={c('Header').t`Billing details`} />
            </div>
            <BoxContent>
                <Group title={c('Title').t`Address`}>
                    <Row label={c('Label').t`Country`}>
                        <CountryValue countryCode={BillingAddress.CountryCode} />
                    </Row>
                    {BillingAddress.Company && <Row label={c('Label').t`Company`}>{BillingAddress.Company}</Row>}
                    {address && <Row label={c('Label').t`Address`}>{address}</Row>}
                    {contact && <Row label={c('Label').t`Billing contact`}>{contact}</Row>}
                    {InvoiceEmail && <Row label={c('Label').t`Invoice email`}>{InvoiceEmail}</Row>}
                </Group>

                <Group title={c('Title').t`Tax`}>
                    <Row label={c('Label').t`Taxable`}>{Taxable ? c('Label').t`Yes` : c('Label').t`No`}</Row>
                    {BillingAddress.VatId && <Row label={c('Label').t`VAT number`}>{BillingAddress.VatId}</Row>}
                </Group>

                <Group title={c('Title').t`Payment`}>
                    <Row label={c('Label').t`Currency`}>{currency}</Row>
                    <Row label={c('Label').t`Payment method`}>{getPaymentMethodLabel(PaymentMethod)}</Row>
                    <Row label={c('Label').t`Payment terms`}>{getPaymentTermsLabel(PaymentTermsDays)}</Row>
                </Group>
            </BoxContent>
        </>
    );
};
