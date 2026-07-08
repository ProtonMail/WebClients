import { isSavedCardDetails } from './type-guards';

/**
 * Check if card is expired at the end of current month
 */
export function isCardExpired(cardDetails: Parameters<typeof isSavedCardDetails>[0]): boolean {
    if (!isSavedCardDetails(cardDetails)) {
        return false;
    }

    const { ExpMonth, ExpYear } = cardDetails;

    const currentTime = new Date();
    const currentMonth = currentTime.getMonth() + 1;
    const currentYear = currentTime.getFullYear();

    return currentYear > +ExpYear || (currentMonth > +ExpMonth && currentYear === +ExpYear);
}
