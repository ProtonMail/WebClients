import PassUI from '@proton/pass/lib/core/ui.proxy';
import { CardType } from '@proton/pass/types/protobuf/item-v1.static';

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
