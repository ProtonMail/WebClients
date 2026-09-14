import { capturePaymentMessage } from '../sentry/capture';
import { PLANS, signupFlows } from './constants';
import type { Invoice, PaymentMethodFlow, PlanIDs } from './interface';
import { getPlanNameFromIDs } from './plan/helpers';

export function isSignupFlow(flow: PaymentMethodFlow): boolean {
    return signupFlows.includes(flow);
}

const CREDIT_NOTE_PREFIX = 'CN';
export function isCreditNoteInvoice(invoice: Pick<Invoice, 'ID'>): boolean {
    return invoice.ID.startsWith(CREDIT_NOTE_PREFIX);
}

const CURRENCY_CONVERSION_PREFIX = 'CC';
function isCurrencyConversionInvoice(invoice: Pick<Invoice, 'ID'>): boolean {
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
            capturePaymentMessage('Payments: wrong plan name', {
                component: 'payments-helpers',
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
 * Correct outdated plan IDs to the relevant ones. The plan IDs counterpart of
 * `correctDeprecatedPlanName`.
 *
 * @param planIDs - The plan IDs to correct.
 * @returns The corrected plan IDs.
 */
export function fixPlanIDs(planIDs: PlanIDs | undefined): PlanIDs | undefined {
    try {
        // if we don't have the deprecated VPN plan then we don't have anything to fix and can return early
        if (!planIDs || !planIDs[PLANS.VPN]) {
            return planIDs;
        }

        const planIDsCopy: PlanIDs = { ...planIDs };

        delete planIDsCopy[PLANS.VPN];
        planIDsCopy[PLANS.VPN2024] = 1;

        return planIDsCopy;
    } catch {
        return planIDs;
    }
}
