import type { ChallengeEvent, ChallengeEventType } from './interface';

/** `focus`/`blur` don't bubble; listen for `focusin`/`focusout` and report as `focus`/`blur`. */
const OBSERVED_EVENTS: { [key: string]: ChallengeEventType } = {
    keydown: 'keydown',
    keyup: 'keyup',
    input: 'input',
    change: 'change',
    focusin: 'focus',
    focusout: 'blur',
    click: 'click',
    paste: 'paste',
    copy: 'copy',
    cut: 'cut',
};

const VALUE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

/** Reveal toggles flip `type` to `text`; a field stays ignored once it was a password. */
const everPassword = new WeakSet<Element>();

const isIgnored = (el: Element) => {
    if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'password') {
        everPassword.add(el);
        return true;
    }
    if (everPassword.has(el)) {
        return true;
    }
    return el.closest('[data-challenge-ignore]') !== null;
};

export const getFieldId = (el: Element) => {
    return el.id || el.getAttribute('name') || '';
};

export const getChallengeEvent = (event: Event): ChallengeEvent | undefined => {
    const type = OBSERVED_EVENTS[event.type];
    const target = event.target;

    if (!type || !(target instanceof Element)) {
        return;
    }

    const id = getFieldId(target);
    if (!id || isIgnored(target)) {
        return;
    }

    const challengeEvent: ChallengeEvent = {
        type,
        id,
        time: Math.round(event.timeStamp),
        isTrusted: event.isTrusted,
        tag: target.tagName.toLowerCase(),
    };

    if (target.tagName === 'INPUT') {
        challengeEvent.inputType = (target as HTMLInputElement).type;
    }

    if (event instanceof KeyboardEvent) {
        challengeEvent.key = event.key;
        challengeEvent.repeat = event.repeat;
    }

    if (VALUE_TAGS.includes(target.tagName)) {
        const { value, selectionStart, selectionEnd } = target as HTMLInputElement;
        if (typeof value === 'string') {
            challengeEvent.length = value.length;
            challengeEvent.value = value;
        }
        // `selectionStart` throws on input types that don't support selection in some browsers, and
        // is `null` on the ones that don't have a selection.
        if (typeof selectionStart === 'number') {
            challengeEvent.selectionStart = selectionStart;
        }
        if (typeof selectionEnd === 'number') {
            challengeEvent.selectionEnd = selectionEnd;
        }
    }

    return challengeEvent;
};

/** Capture phase */
export const observeEvents = (el: HTMLElement, onEvent: (event: ChallengeEvent) => void) => {
    const handler = (event: Event) => {
        const challengeEvent = getChallengeEvent(event);
        if (challengeEvent) {
            onEvent(challengeEvent);
        }
    };

    const types = Object.keys(OBSERVED_EVENTS);
    types.forEach((type) => el.addEventListener(type, handler, true));

    return () => {
        types.forEach((type) => el.removeEventListener(type, handler, true));
    };
};
