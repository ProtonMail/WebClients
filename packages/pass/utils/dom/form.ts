import type { Maybe } from '@proton/pass/types';
import { isFormElement } from '@proton/pass/utils/dom';

export const parseFormAction = (form: HTMLElement): Maybe<string> => {
    const isForm = isFormElement(form);

    if (isForm) {
        const action = form.action as string | HTMLInputElement;
        return typeof action === 'string' ? action : action.value;
    }
};
