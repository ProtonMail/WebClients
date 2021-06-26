import React, { /* useEffect, */ useRef } from 'react';
import { KeyboardKey, KeyboardKeyType } from '@proton/shared/lib/interfaces';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { isMac } from '@proton/shared/lib/helpers/browser';

import { useEventListener } from './useHandler';

/*
 * A Hotkey being an array means we have a "modifier" combination
 * of keys (e.g. "Cmd + K" would translate to ['Meta', 'K'])
 * */
type Hotkey = KeyboardKeyType | KeyboardKeyType[];

/*
 * A Sequence is a suite of Hotkeys
 * (e.g. press "G" then "I" to navigate to the Inbox folder)
 * */
type Sequence = Hotkey[];

type HotKeyCallback = (e: KeyboardEvent) => void;

/*
 * The longest allowed sequence matches the "Konami code" length
 * if ever someone wants to do implement it somewhere ¯\_(ツ)_/¯
 * */
// @todo try to find a way to have an infinity of hotkeys if wanted
export type HotkeyTuple =
    | [Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, Hotkey, Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, HotKeyCallback]
    | [Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, Hotkey, HotKeyCallback];

type KeyEventType = 'keyup' | 'keydown' | 'keypress';

type HotKeysOptions = {
    keyEventType?: KeyEventType;
    sequenceResetTime?: number;
    dependencies?: React.DependencyList;
};

const MODIFIER_KEYS = {
    META: KeyboardKey.Meta.toLowerCase(),
    SHIFT: KeyboardKey.Shift.toLowerCase(),
    CONTROL: KeyboardKey.Control.toLowerCase(),
    ALT: KeyboardKey.Alt.toLowerCase(),
};

const isMacOS = isMac();

const normalizeHotkeySequence = (a: string | string[]) =>
    Array.isArray(a) ? a.sort().map((k) => k.toLowerCase()) : [a.toLowerCase()];

/*
 * Here we normalize Meta / Ctrl for Mac / PC & Linux users
 * E.g. ['Meta', 'A'] will translate `Cmd + A` for Mac users and `Ctrl + A` for PC/Linux users
 * */
const normalizeMetaControl = (initalTuple: HotkeyTuple) => {
    const sequence = initalTuple.slice(0, -1) as Sequence;
    const callback = initalTuple[initalTuple.length - 1];

    const keys = sequence.reduce<Sequence>((acc, hotkey) => {
        if (Array.isArray(hotkey)) {
            acc.push(hotkey.map((k) => (!isMacOS && k === KeyboardKey.Meta ? KeyboardKey.Control : k)));
        } else {
            acc.push(!isMacOS && hotkey === KeyboardKey.Meta ? KeyboardKey.Control : hotkey);
        }

        return acc;
    }, []);

    return [...keys, callback];
};

export const useHotkeys = (
    ref: React.RefObject<HTMLElement | Document | undefined>,
    hotkeyTupleArray: HotkeyTuple[],
    options?: HotKeysOptions
) => {
    const { keyEventType = 'keydown', sequenceResetTime = 1000, dependencies = [] } = options || {};
    const msSinceLastEvent = useRef(0);

    const sequence = useRef<Sequence>([]);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!e.key) {
            return;
        }
        const key = e.key.toLowerCase() as KeyboardKey;

        if (Date.now() - msSinceLastEvent.current > sequenceResetTime) {
            sequence.current = [];
        }

        msSinceLastEvent.current = Date.now();

        if ([MODIFIER_KEYS.ALT, MODIFIER_KEYS.SHIFT, MODIFIER_KEYS.CONTROL, MODIFIER_KEYS.META].includes(key)) {
            return;
        }

        const isAlphaNumericalOrSpace = key.match(/[a-zA-Z1-9 ]/gi);

        const modifiedKey = [
            key,
            e.metaKey && MODIFIER_KEYS.META,
            e.ctrlKey && MODIFIER_KEYS.CONTROL,
            // Some non-alphanumerical keys need Shift or Alt modifiers
            // to be typed, thus cannot be used (e.g. "?" or "/")
            isAlphaNumericalOrSpace && e.shiftKey && MODIFIER_KEYS.SHIFT,
            isAlphaNumericalOrSpace && e.altKey && MODIFIER_KEYS.ALT,
        ].filter(isTruthy) as Hotkey;

        sequence.current.push(modifiedKey);

        const normalizedHotkeyTupleArray = hotkeyTupleArray.map(normalizeMetaControl);

        for (let i = 0; i < normalizedHotkeyTupleArray.length; i++) {
            const hotKeyTuple = normalizedHotkeyTupleArray[i];

            const hotkeySequence = (hotKeyTuple.slice(0, -1) as Sequence).map(normalizeHotkeySequence);
            /*
             * take the number of items from the sequence as the number of items in
             * the hotkey sequence, starting from the end, so that even if the sequences
             * are not identical, a match is still found should the tails be identical
             * */
            const tailSequence = sequence.current.slice(-hotkeySequence.length).map(normalizeHotkeySequence);

            if (isDeepEqual(hotkeySequence, tailSequence)) {
                const callback = hotKeyTuple[hotKeyTuple.length - 1] as HotKeyCallback;
                callback(e);
                break;
            }
        }
    };

    useEventListener(ref, keyEventType, handleKeyDown, dependencies);
};
