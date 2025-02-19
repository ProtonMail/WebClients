import { c } from 'ttag';

import { isDialogOpen, isDropdownOpen, isModalOpen } from '../busy';
import { metaKey } from '../helpers/browser';

export const getShortcuts = () => {
    return [
        {
            name: c('Keyboard shortcut section name').t`Basic actions`,
            shortcuts: [
                {
                    name: c('Keyboard shortcut name').t`Create new event`,
                    keys: 'N',
                },
                {
                    name: c('Keyboard shortcut name').t`Search events`,
                    keys: '/',
                },
                {
                    name: c('Keyboard shortcut name').t`Open quick actions menu`,
                    keys: `${metaKey} + K`,
                },
                {
                    name: c('Keyboard shortcut name').t`Open this modal`,
                    keys: '?',
                },
            ],
        },
        {
            name: c('Keyboard shortcut section name').t`View options`,
            shortcuts: [
                {
                    name: c('Keyboard shortcut name').t`Today`,
                    keys: 'T',
                },
                {
                    name: c('Keyboard shortcut name').t`Day view`,
                    keys: '1',
                },
                {
                    name: c('Keyboard shortcut name').t`Week view`,
                    keys: '2',
                },
                {
                    name: c('Keyboard shortcut name').t`Month view`,
                    keys: '3',
                },
                {
                    name: c('Keyboard shortcut name').t`Next period`,
                    keys: '→',
                },
                {
                    name: c('Keyboard shortcut name').t`Previous period`,
                    keys: '←',
                },
            ],
        },
    ];
};

export const isBusy = (event: KeyboardEvent): boolean => {
    if (isDialogOpen() || isModalOpen() || isDropdownOpen()) {
        return true;
    }
    const target = event.target as HTMLElement;
    return ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
};
