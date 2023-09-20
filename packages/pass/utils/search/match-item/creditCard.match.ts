import type { ItemMatchFunc } from '@proton/pass/utils/search';
import { matchAny } from '@proton/pass/utils/search';

import { deobfuscate } from '../../obfuscate/xor';

const matchesCreditCardItem: ItemMatchFunc<'creditCard'> = ({
    metadata: { name, note },
    content: { cardholderName, number },
}) => matchAny([name, deobfuscate(note), cardholderName, deobfuscate(number)]);

export default matchesCreditCardItem;
