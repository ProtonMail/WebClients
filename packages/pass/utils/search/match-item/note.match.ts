import type { ItemMatchFunc } from '@proton/pass/utils/search';
import { matchAny } from '@proton/pass/utils/search';

import { deobfuscate } from '../../obfuscate/xor';

const matchesNoteItem: ItemMatchFunc<'note'> = ({ metadata: { name, note } }) => matchAny([name, deobfuscate(note)]);

export default matchesNoteItem;
