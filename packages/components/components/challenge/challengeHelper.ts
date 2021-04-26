import ReactTestUtils from 'react-dom/test-utils';
import { getBrowserLocale } from 'proton-shared/lib/i18n/helper';
import { getTimezone } from 'proton-shared/lib/date/timezone';
import { captureMessage } from 'proton-shared/lib/helpers/sentry';
import { Severity } from '@sentry/types';

import { ChallengeLog } from './interface';

// Select option is broken on react. Correct the HTML here.
export const normalizeSelectOptions = (el: HTMLElement) => {
    el.querySelectorAll('select').forEach((selectEl) => {
        for (let i = 0; i < selectEl.children.length; ++i) {
            const liEl = selectEl.children[i];
            if (i === selectEl.selectedIndex) {
                liEl.setAttribute('selected', 'true');
            } else {
                liEl.removeAttribute('selected');
            }
        }
    });
};

interface EventPayload {
    type: string;
    id?: string;
    value?: string;
    key?: string;
}

export const handleEvent = (renderEl: HTMLElement | undefined, eventPayload: EventPayload) => {
    if (!renderEl) {
        return;
    }
    const { type, id } = eventPayload;
    if (type === 'keydown' && id) {
        const inputEl = renderEl.querySelector<HTMLInputElement>(`#${id}`);
        if (inputEl) {
            ReactTestUtils.Simulate.keyDown(inputEl, { key: eventPayload.key });
        }
    }
    if (type === 'input' && id) {
        const inputEl = renderEl.querySelector<HTMLInputElement>(`#${id}`);
        if (inputEl) {
            inputEl.value = eventPayload.value || '';
            ReactTestUtils.Simulate.change(inputEl);
        }
    }
    if (type === 'click' && id) {
        const targetEl = renderEl.querySelector(`#${id}`);
        if (targetEl) {
            ReactTestUtils.Simulate.click(targetEl);
        }
    }
};

export const getStyleSrcUrls = () => {
    return [...document.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet]')]
        .map((x) => {
            return new URL(x.href, window.location.origin).toString();
        })
        .filter((url) => {
            return url.startsWith(window.location.origin) && url.endsWith('.css');
        });
};

export const getStyleSrcsData = (styleSrcUrls: string[]) => {
    return Promise.all(
        styleSrcUrls.map(async (styleSrcUrls) => {
            const response = await fetch(styleSrcUrls);
            const text = await response.text();
            const trimmedText = text.replace(/^\s+/, '');
            if (trimmedText[0] === '<') {
                throw new Error(`Invalid data ${styleSrcUrls} ${trimmedText.slice(0, 10)}`);
            }
            return trimmedText;
        })
    ).then((results) => {
        return results.join('');
    });
};

export const captureChallengeMessage = (message: string, logs: ChallengeLog[]) => {
    if (
        !logs.some(({ type }) => {
            return type === 'error';
        })
    ) {
        return;
    }
    captureMessage(message, {
        level: Severity.Error,
        extra: {
            logs,
            locale: getBrowserLocale(),
            timezone: getTimezone(),
            time: new Date().toString(),
        },
    });
};
