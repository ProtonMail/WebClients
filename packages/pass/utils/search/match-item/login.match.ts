import type { ItemMatchFunc } from '@proton/pass/utils/search';
import { matchAny } from '@proton/pass/utils/search';

import { deobfuscate } from '../../obfuscate/xor';

const matchesLoginItem: ItemMatchFunc<'login'> = ({ metadata: { name, note }, content: { username, urls } }) =>
    matchAny([name, deobfuscate(note), deobfuscate(username), ...urls]);

export default matchesLoginItem;
