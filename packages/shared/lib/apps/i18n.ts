import { c } from 'ttag';

export const getExploreText = (target: string) => {
    return c('Action').t`Explore ${target}`;
};
