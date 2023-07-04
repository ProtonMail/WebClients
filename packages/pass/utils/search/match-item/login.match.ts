import type { ItemMatchFunc } from '@proton/pass/utils/search';
import { matchAny } from '@proton/pass/utils/search';

const matchesLoginItem: ItemMatchFunc<'login'> = ({ metadata: { name, note }, content: { username, urls } }) =>
    matchAny([name, note, username, ...urls]);

export default matchesLoginItem;
