import type { ItemMatchFunc } from '@proton/pass/utils/search';
import { matchAny } from '@proton/pass/utils/search';

const matchesCreditCardItem: ItemMatchFunc<'creditCard'> = ({ metadata: { name } }) => matchAny([name]);

export default matchesCreditCardItem;
