import { c } from 'ttag';

export const defaultPersistentKey = 'default-persistent';

export const getContinueToString = (product: string) => {
    return c('Info').t`To continue to ${product}`;
};
