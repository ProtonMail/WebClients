import type { ItemMatchFunc } from '@proton/pass/utils/search';
import { matchAny } from '@proton/pass/utils/search';

import { deobfuscate } from '../../obfuscate/xor';

const matchesAliasItem: ItemMatchFunc<'alias'> = ({ metadata: { name, note } }) => matchAny([name, deobfuscate(note)]);

export default matchesAliasItem;
