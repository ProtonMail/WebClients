import { CachedKey } from '../interfaces';

export default (keys: CachedKey[], ID: string) => {
    return keys.find(({ Key: { ID: otherID } }) => ID === otherID);
};
