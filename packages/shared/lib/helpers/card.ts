// todo: move to payments/core
import { CardDetails, isCardDetails } from '@proton/components/payments/core';

/**
 * Check if card is expired at the end of current month
 */
export function isExpired(cardDetails: CardDetails | unknown): boolean {
    if (!isCardDetails(cardDetails)) {
        return false;
    }

    const { ExpMonth, ExpYear } = cardDetails;

    const currentTime = new Date();
    const currentMonth = currentTime.getMonth() + 1;
    const currentYear = currentTime.getFullYear();

    return currentMonth > +ExpMonth && currentYear >= +ExpYear;
}
