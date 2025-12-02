import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { PLANS, signupFlows } from './constants';
import type { Invoice, PaymentMethodFlow, PlainPaymentMethodType, PlanIDs } from './interface';
import { getPlanNameFromIDs } from './plan/helpers';

export function isChargebeePaymentMethod(paymentMethodType: PlainPaymentMethodType | undefined) {
    if (!paymentMethodType) {
        return false;
    }

    switch (paymentMethodType) {
        case 'card':
        case 'paypal':
        case 'bitcoin':
        case 'cash':
        case 'token':
            return false;

        case 'chargebee-bitcoin':
        case 'chargebee-card':
        case 'chargebee-paypal':
            return true;
    }
}

export function isSignupFlow(flow: PaymentMethodFlow): boolean {
    return signupFlows.includes(flow);
}

const CREDIT_NOTE_PREFIX = 'CN';
export function isCreditNoteInvoice(invoice: Pick<Invoice, 'ID'>): boolean {
    return invoice.ID.startsWith(CREDIT_NOTE_PREFIX);
}

const CURRENCY_CONVERSION_PREFIX = 'CC';
export function isCurrencyConversionInvoice(invoice: Pick<Invoice, 'ID'>): boolean {
    return invoice.ID.startsWith(CURRENCY_CONVERSION_PREFIX);
}

export function isRegularInvoice(invoice: Pick<Invoice, 'ID'>): boolean {
    return !isCreditNoteInvoice(invoice) && !isCurrencyConversionInvoice(invoice);
}

/**
 * Report to Sentry that the plan name is incorrect.
 *
 * @param planName - The plan name to report.
 * @param context - The context of the plan name. In other words, in what context the plan name is used.
 * This is helpful for debugging.
 */
export function captureWrongPlanName(
    planName: string | undefined,
    context: {
        source: string;
        [key: string]: any;
    }
) {
    try {
        if (planName === PLANS.VPN) {
            captureMessage('Payments: wrong plan name', {
                level: 'warning',
                extra: { planName, ...context },
            });
        }
    } catch {}
}

/**
 * Report to Sentry that the plan IDs are incorrect. Sister function to `captureWrongPlanName`.
 *
 * @param planIDs - The plan IDs to report.
 * @param context - The context of the plan IDs. In other words, in what context the plan IDs are used.
 * This is helpful for debugging.
 */
export function captureWrongPlanIDs(
    planIDs: PlanIDs | undefined,
    context: {
        source: string;
        [key: string]: any;
    }
) {
    try {
        if (!planIDs) {
            return;
        }

        const planName = getPlanNameFromIDs(planIDs);
        if (planName === PLANS.VPN) {
            captureWrongPlanName(planName, { planIDs, ...context });
        }
    } catch {}
}

/**
 * Correct outdated plan names to the relevant ones.
 *
 * @param planName - The plan name to correct.
 * @param source - The source of the plan name. In other words, in what context the plan name is used.
 * This is helpful for debugging.
 * @returns The corrected plan name.
 */
export function fixPlanName(planName: PLANS, source: string): PLANS;
export function fixPlanName(planName: string, source: string): string;
export function fixPlanName(planName: PLANS | undefined, source: string): PLANS | undefined;
export function fixPlanName(planName: string | undefined, source: string): string | undefined;
export function fixPlanName(planName: string | null, source: string): string | null;
export function fixPlanName(planName: string | null | undefined, source: string): string | null | undefined {
    if (planName === PLANS.VPN) {
        captureWrongPlanName(planName, { source });
        return PLANS.VPN2024;
    }

    return planName;
}

/**
 * Correct outdated plan IDs to the relevant ones. A sister function to `fixPlanName`.
 *
 * @param planIDs - The plan IDs to correct.
 * @param source - The source of the plan IDs. In other words, in what context the plan IDs are used.
 * This is helpful for debugging.
 * @returns The corrected plan IDs.
 */
export function fixPlanIDs(planIDs: PlanIDs | undefined, source: string): PlanIDs | undefined {
    try {
        // if we don't have the deprecated VPN plan then we don't have anything to fix and can return early
        if (!planIDs || !planIDs[PLANS.VPN]) {
            return planIDs;
        }

        const planIDsCopy: PlanIDs = { ...planIDs };

        delete planIDsCopy[PLANS.VPN];
        planIDsCopy[PLANS.VPN2024] = 1;

        captureWrongPlanIDs(planIDsCopy, { source });

        return planIDsCopy;
    } catch {
        return planIDs;
    }
}
