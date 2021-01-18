import { c } from 'ttag';
import { metaKey } from 'proton-shared/lib/helpers/browser';

export default [
    {
        name: c('Keyboard shortcut section name').t`Basic navigation`,
        alwaysActive: true,
        shortcuts: [
            {
                name: c('Keyboard shortcut name').t`Move up`,
                keys: '↑',
            },
            {
                name: c('Keyboard shortcut name').t`Jump to first`,
                keys: `${metaKey} + ↑`,
            },
            {
                name: c('Keyboard shortcut name').t`Move down`,
                keys: '↓',
            },
            {
                name: c('Keyboard shortcut name').t`Jump to last`,
                keys: `${metaKey} + ↓`,
            },
            {
                name: c('Keyboard shortcut name').t`Move right / expand`,
                keys: '→',
            },
            {
                name: c('Keyboard shortcut name').t`Move left / collapse`,
                keys: '←',
            },
        ],
    },
    {
        name: c('Keyboard shortcut section name').t`Basic actions`,
        alwaysActive: true,
        shortcuts: [
            {
                name: c('Keyboard shortcut name').t`Apply / open`,
                keys: 'Enter',
            },
            {
                name: c('Keyboard shortcut name').t`Cancel / close`,
                keys: 'Escape',
            },
            {
                name: c('Keyboard shortcut name').t`Open this modal`,
                keys: '?',
            },
            {
                name: c('Keyboard shortcut name').t`Select / unselect`,
                keys: 'Space',
            },
        ],
    },
    {
        name: c('Keyboard shortcut section name').t`Folder shortcuts`,
        shortcuts: [
            {
                name: c('Keyboard shortcut name').t`Go to Inbox`,
                keys: ['G', 'I'],
            },
            {
                name: c('Keyboard shortcut name').t`Go to Archive`,
                keys: ['G', 'A'],
            },
            {
                name: c('Keyboard shortcut name').t`Go to Sent`,
                keys: ['G', 'E'],
            },
            {
                name: c('Keyboard shortcut name').t`Go to Starred`,
                keys: ['G', '*'],
            },
            {
                name: c('Keyboard shortcut name').t`Go to Drafts`,
                keys: ['G', 'D'],
            },
            {
                name: c('Keyboard shortcut name').t`Go to Trash`,
                keys: ['G', 'T'],
            },
            {
                name: c('Keyboard shortcut name').t`Go to Spam`,
                keys: ['G', 'S'],
            },
            {
                name: c('Keyboard shortcut name').t`Go to All Mail`,
                keys: ['G', 'M'],
            },
        ],
    },
    {
        name: c('Keyboard shortcut section name').t`Composer shortcuts`,
        shortcuts: [
            {
                name: c('Keyboard shortcut name').t`Send email`,
                keys: `${metaKey} + Enter`,
            },
            {
                name: c('Keyboard shortcut name').t`Close draft`,
                keys: `Escape`,
            },
            {
                name: c('Keyboard shortcut name').t`Minimize composer`,
                keys: `${metaKey} + M`,
            },
            {
                name: c('Keyboard shortcut name').t`Maximize composer`,
                keys: `${metaKey} + Shift + M`,
            },
            {
                name: c('Keyboard shortcut name').t`Attach file`,
                keys: `${metaKey} + Shift + A`,
            },
            {
                name: c('Keyboard shortcut name').t`Add expiration time`,
                keys: `${metaKey} + Shift + X`,
            },
            {
                name: c('Keyboard shortcut name').t`Add encryption`,
                keys: `${metaKey} + Shift + E`,
            },
            {
                name: c('Keyboard shortcut name').t`Discard draft`,
                keys: `${metaKey} + Alt + Backspace`,
            },
        ],
    },
    {
        name: c('Keyboard shortcut section name').t`List shortcuts`,
        shortcuts: [
            {
                name: c('Keyboard shortcut name').t`Open previous message`,
                keys: 'K',
            },
            {
                name: c('Keyboard shortcut name').t`Open next message`,
                keys: 'J',
            },
            {
                name: c('Keyboard shortcut name').t`Select / unselect`,
                keys: 'X',
            },
            {
                name: c('Keyboard shortcut name').t`Show unread emails`,
                keys: 'Shift + U',
            },
            {
                name: c('Keyboard shortcut name').t`Show all emails`,
                keys: 'Shift + A',
            },
            {
                name: c('Keyboard shortcut name').t`Select / unselect all`,
                keys: `${metaKey} + A`,
            },
            {
                name: c('Keyboard shortcut name').t`Search`,
                keys: '/',
            },
        ],
    },
    {
        name: c('Keyboard shortcut section name').t`Action shortcuts`,
        shortcuts: [
            {
                name: c('Keyboard shortcut name').t`New message`,
                keys: 'N',
            },
            {
                name: c('Keyboard shortcut name').t`Star`,
                keys: '*',
            },
            {
                name: c('Keyboard shortcut name').t`Mark as unread`,
                keys: 'U',
            },
            {
                name: c('Keyboard shortcut name').t`Label as...`,
                keys: 'L',
            },
            {
                name: c('Keyboard shortcut name').t`Create filter with...`,
                keys: 'F',
            },
            {
                name: c('Keyboard shortcut name').t`Move to...`,
                keys: 'M',
            },
            {
                name: c('Keyboard shortcut name').t`Move to Inbox`,
                keys: 'I',
            },
            {
                name: c('Keyboard shortcut name').t`Move to Archive`,
                keys: 'A',
            },
            {
                name: c('Keyboard shortcut name').t`Move to Spam`,
                keys: 'S',
            },
            {
                name: c('Keyboard shortcut name').t`Move to Trash`,
                keys: 'T',
            },
            {
                name: c('Keyboard shortcut name').t`Delete permanently`,
                keys: `${metaKey} + Backspace`,
            },
            {
                name: c('Keyboard shortcut name').t`Empty folder`,
                keys: `${metaKey} + Shift + Backspace`,
            },
        ],
    },
    {
        name: c('Keyboard shortcut section name').t`Message shortcuts`,
        shortcuts: [
            {
                name: c('Keyboard shortcut name').t`Reply`,
                keys: 'R',
            },
            {
                name: c('Keyboard shortcut name').t`Reply all`,
                keys: 'Shift + R',
            },
            {
                name: c('Keyboard shortcut name').t`Forward`,
                keys: 'Shift + F',
            },
            {
                name: c('Keyboard shortcut name').t`Load remote content`,
                keys: 'Shift + C',
            },
            {
                name: c('Keyboard shortcut name').t`Load embedded images`,
                keys: 'Shift + E',
            },
            {
                name: c('Keyboard shortcut name').t`Show original message`,
                keys: 'O',
            },
        ],
    },
];
