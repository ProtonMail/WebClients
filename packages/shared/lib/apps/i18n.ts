import { c } from 'ttag';

export const getExploreText = (target: string) => {
    return c('Action').t`Explore ${target}`;
};

export const getFreeTitle = (appName: string) => {
    return c('Title').t`${appName} Free`;
};

export const getPlusTitle = (appName: string) => {
    return `${appName} Plus`;
};
