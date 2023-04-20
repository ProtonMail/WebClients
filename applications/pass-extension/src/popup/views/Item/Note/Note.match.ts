import { ItemMatchFunc, matchAny } from '@proton/pass/utils/search';

const matchesNoteItem: ItemMatchFunc<'note'> = ({ metadata: { name, note } }) => matchAny([name, note]);

export default matchesNoteItem;
