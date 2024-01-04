import { c } from 'ttag';

export const getAutomaticText = (value: string) => {
    return c('Option').t`Automatic (${value})`;
};

export const getDeleteText = (value: string) => {
    return c('Title').t`Delete ${value}`;
};
