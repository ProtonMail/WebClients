import { ItemMatchFunc, matchAny } from '@proton/pass/utils/search';

const matchesAliasItem: ItemMatchFunc<'alias'> = ({ metadata: { name, note } }) => matchAny([name, note]);

export default matchesAliasItem;
