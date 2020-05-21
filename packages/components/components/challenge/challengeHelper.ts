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

export const getChallengeURL = (API_URL: string, type: number) => {
    return new URL(`${API_URL}/challenge/js?Type=${type}`, window.location.origin);
};
