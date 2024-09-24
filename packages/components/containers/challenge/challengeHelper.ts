import ReactTestUtils from 'react-dom/test-utils';

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
    return [...document.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet]')].reduce<string[]>((acc, link) => {
        const url = new URL(link.href, window.location.origin);
        if (url.origin.startsWith(window.location.origin) && url.pathname.endsWith('.css')) {
            acc.push(url.toString());
        }
        return acc;
    }, []);
};

export const getStyleSrcsData = (styleSrcUrls: string[]) => {
    return Promise.all(
        styleSrcUrls.map(async (styleSrcUrls) => {
            const response = await fetch(styleSrcUrls);
            const text = await response.text();
            const trimmedText = text.replace(/^\s+/, '');
            if (!(response.status >= 200 && response.status < 300) || trimmedText[0] === '<') {
                throw new Error('Invalid asset loading');
            }
            return [...trimmedText.matchAll(/url\(\/(assets\/[^)]+)\)/g)]
                .map((matchArray) => {
                    const [all, match] = matchArray;
                    const newUrl = new URL(match, window.location.origin);
                    // Chrome uses the cached font response making CORS fail.
                    // Cache bust it by adding a query parameter.
                    newUrl.searchParams.set('t', `${Date.now()}`);
                    return {
                        all,
                        newUrl: newUrl.toString(),
                    };
                })
                .reduce((acc, cur) => {
                    return acc.replace(cur.all, `url(${cur.newUrl})`);
                }, trimmedText);
        })
    ).then((results) => {
        return results.join('');
    });
};
