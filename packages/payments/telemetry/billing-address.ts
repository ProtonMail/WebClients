/**
 * Billing Address Telemetry
 *
 * Events for the "Edit billing address" modal. This uses a fixed event name rather than a
 * context-based one, because the modal opens from both checkout and the invoices settings page.
 */
import { telemetry } from '@proton/shared/lib/telemetry';

import type { FullBillingAddress } from '../core/billing-address/billing-address';

/** Where the user opened the modal from. */
export type BillingAddressEditSource = 'tax-fields' | 'pay-button' | 'invoices';

/**
 * Stage of the billing address edit funnel.
 *
 * Only the successful save is reported for now. Further stages (modal opened, validation blocked,
 * address rejected by the backend) can be added here later without changing the event name.
 */
export type BillingAddressEditStage = 'save_success';

/**
 * What the event reports about an edit.
 *
 * Country and state are reported as values, matching `reportBillingCountryChange`. Every other
 * field is reported only as whether it changed - those fields carry the customer's name, street,
 * city, company, zip and VAT number, none of which may reach telemetry.
 */
export type BillingAddressEditTelemetryProperties = {
    previousCountry: string | null;
    nextCountry: string | null;
    previousState: string | null;
    nextState: string | null;
    zipCodeChanged: boolean;
    vatIdChanged: boolean;
    companyChanged: boolean;
    cityChanged: boolean;
    addressChanged: boolean;
    firstNameChanged: boolean;
    lastNameChanged: boolean;
};

/**
 * Reduces a pair of billing addresses to the facts we are allowed to report.
 *
 * The addresses themselves must never reach telemetry. The return type is pinned to these
 * properties so nothing else can be added here by accident.
 */
export function getBillingAddressEditProperties(
    previous: FullBillingAddress,
    next: FullBillingAddress
): BillingAddressEditTelemetryProperties {
    const changed = (field: 'ZipCode' | 'Company' | 'City' | 'Address' | 'FirstName' | 'LastName'): boolean =>
        // an empty text input and an absent value both mean "not set", so neither counts as a change
        (previous.BillingAddress[field] || null) !== (next.BillingAddress[field] || null);

    // make sure to map undefined and empty strings to null
    return {
        previousCountry: previous.BillingAddress.CountryCode || null,
        nextCountry: next.BillingAddress.CountryCode || null,
        previousState: previous.BillingAddress.State || null,
        nextState: next.BillingAddress.State || null,
        zipCodeChanged: changed('ZipCode'),
        vatIdChanged: (previous.VatId || null) !== (next.VatId || null),
        companyChanged: changed('Company'),
        cityChanged: changed('City'),
        addressChanged: changed('Address'),
        firstNameChanged: changed('FirstName'),
        lastNameChanged: changed('LastName'),
    };
}

/**
 * Reports a successful save in the "Edit billing address" modal.
 *
 * **Event Name:** `billing_address_edit`
 *
 * **When to call:** After the address has been accepted by the backend.
 *
 * **Purpose:** Measure how often users successfully save a billing address, and which fields they
 * actually change.
 *
 * @param props.previousBillingAddress - The address as it was loaded into the modal
 * @param props.nextBillingAddress - The address that was saved
 */
export function reportBillingAddressEditSuccess({
    source,
    previousBillingAddress,
    nextBillingAddress,
}: {
    source: BillingAddressEditSource;
    previousBillingAddress: FullBillingAddress;
    nextBillingAddress: FullBillingAddress;
}) {
    telemetry.sendCustomEvent('billing_address_edit', {
        stage: 'save_success' satisfies BillingAddressEditStage,
        source,
        ...getBillingAddressEditProperties(previousBillingAddress, nextBillingAddress),
    });
}
