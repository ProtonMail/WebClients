import { ItemMatchFunc, matchAny } from '@proton/pass/utils/search';

const matchesLoginItem: ItemMatchFunc<'login'> = ({ metadata: { name }, content: { username, urls } }) =>
    matchAny([name, username, ...urls]);

export default matchesLoginItem;
