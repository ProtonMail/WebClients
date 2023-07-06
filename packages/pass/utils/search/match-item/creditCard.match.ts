import type { ItemMatchFunc } from '@proton/pass/utils/search';
import { matchAny } from '@proton/pass/utils/search';

const matchesCreditCardItem: ItemMatchFunc<'creditCard'> = ({
    metadata: { name, note },
    content: { cardholderName, number },
}) => matchAny([name, note, cardholderName, number]);

export default matchesCreditCardItem;
