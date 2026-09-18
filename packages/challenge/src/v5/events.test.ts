import { getChallengeEvent, getFieldId, observeEvents } from './events';
import type { ChallengeEvent } from './interface';

describe('getFieldId', () => {
    it('prefers the id', () => {
        const el = document.createElement('input');
        el.id = 'email';
        el.setAttribute('name', 'username');
        expect(getFieldId(el)).toBe('email');
    });

    it('falls back to the name', () => {
        const el = document.createElement('input');
        el.setAttribute('name', 'username');
        expect(getFieldId(el)).toBe('username');
    });

    it('is empty for an unidentified field', () => {
        expect(getFieldId(document.createElement('input'))).toBe('');
    });
});

describe('getChallengeEvent', () => {
    const dispatch = (el: Element, event: Event) => {
        el.dispatchEvent(event);
        return getChallengeEvent(event);
    };

    it('describes a keystroke', () => {
        const el = document.createElement('input');
        el.id = 'email';
        el.value = 'ab';

        const result = dispatch(el, new KeyboardEvent('keydown', { key: 'b' }));

        expect(result).toMatchObject({
            type: 'keydown',
            id: 'email',
            key: 'b',
            repeat: false,
            tag: 'input',
            inputType: 'text',
            value: 'ab',
            length: 2,
            isTrusted: false,
        });
    });

    it('reports focus and blur under the names the frame replays', () => {
        const el = document.createElement('input');
        el.id = 'email';

        expect(dispatch(el, new FocusEvent('focusin'))?.type).toBe('focus');
        expect(dispatch(el, new FocusEvent('focusout'))?.type).toBe('blur');
    });

    it('ignores events we do not forward', () => {
        const el = document.createElement('input');
        el.id = 'email';
        expect(dispatch(el, new Event('scroll'))).toBeUndefined();
    });

    it('ignores events on unidentified targets', () => {
        const el = document.createElement('input');
        expect(dispatch(el, new Event('input'))).toBeUndefined();
    });

    describe('ignored fields', () => {
        it('drops password field events', () => {
            const el = document.createElement('input');
            el.id = 'password';
            el.type = 'password';
            el.value = 'hunter2';

            expect(dispatch(el, new Event('input'))).toBeUndefined();
            expect(dispatch(el, new KeyboardEvent('keydown', { key: 'a' }))).toBeUndefined();
        });

        it('keeps ignoring after a reveal toggle flips the field to text', () => {
            const el = document.createElement('input');
            el.id = 'password';
            el.type = 'password';
            el.value = 'hunter2';

            expect(dispatch(el, new Event('input'))).toBeUndefined();

            // What clicking the eye on PasswordInputTwo does.
            el.type = 'text';

            expect(dispatch(el, new Event('input'))).toBeUndefined();
        });

        it('drops events on a field marked data-challenge-ignore directly', () => {
            const el = document.createElement('input');
            el.id = 'secret';
            el.value = 'sensitive';
            el.setAttribute('data-challenge-ignore', '');

            expect(dispatch(el, new Event('input'))).toBeUndefined();
        });

        it('drops events on anything under data-challenge-ignore', () => {
            const wrapper = document.createElement('div');
            wrapper.setAttribute('data-challenge-ignore', '');
            const el = document.createElement('input');
            el.id = 'secret';
            el.value = 'sensitive';
            wrapper.appendChild(el);

            expect(dispatch(el, new Event('input'))).toBeUndefined();
        });
    });
});

describe('observeEvents', () => {
    let container: HTMLDivElement;
    let input: HTMLInputElement;
    let events: ChallengeEvent[];
    let unobserve: () => void;

    beforeEach(() => {
        container = document.createElement('div');
        input = document.createElement('input');
        input.id = 'email';
        container.appendChild(input);
        document.body.appendChild(container);

        events = [];
        unobserve = observeEvents(container, (event) => events.push(event));
    });

    afterEach(() => {
        unobserve();
        container.remove();
    });

    it('forwards interactions from anywhere in the subtree', () => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
        input.value = 'a';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        expect(events.map((event) => event.type)).toEqual(['keydown', 'input']);
        expect(events[1].value).toBe('a');
    });

    it('still sees events a field stops from propagating', () => {
        input.addEventListener('keydown', (event) => event.stopPropagation());

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));

        expect(events).toHaveLength(1);
    });

    it('stops once unobserved', () => {
        unobserve();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
        expect(events).toHaveLength(0);
    });

    it('does not forward events from password-like fields in the subtree', () => {
        const password = document.createElement('input');
        password.id = 'password';
        password.type = 'password';
        container.appendChild(password);

        password.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
        password.dispatchEvent(new Event('input', { bubbles: true }));

        expect(events).toHaveLength(0);
    });
});
