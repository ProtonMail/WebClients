import PassUI from '../../../lib/core/ui.proxy';
import { CardType } from '../../../types/protobuf';

export const getCreditCardType = async (number: string): Promise<CardType> => {
    try {
        if (!number.trim()) return CardType.Unspecified;
        switch (await PassUI.detect_credit_card_type(number)) {
            case 'AmericanExpress':
                return CardType.AmericanExpress;
            case 'Visa':
                return CardType.Visa;
            case 'Mastercard':
            case 'Maestro':
                return CardType.Mastercard;
            default:
                return CardType.Other;
        }
    } catch {
        return CardType.Unspecified;
    }
};
