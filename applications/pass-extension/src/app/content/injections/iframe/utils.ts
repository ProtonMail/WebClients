import type { IFrameMessageWithSender } from 'proton-pass-extension/app/content/types';

import { first } from '@proton/pass/utils/array/first';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { isObject } from '@proton/pass/utils/object/is-object';

export const isIFrameMessage = (message: unknown): message is IFrameMessageWithSender =>
    isObject(message) && 'type' in message && typeof message.type === 'string';

/** Sanitizes iframe styles to prevent clickjacking attacks.
 * This function removes all non-CSS-variable style properties from an
 * iframe element,  which prevents malicious sites from manipulating our
 * iframe's appearance or behavior. Only CSS custom properties are preserved,
 * while all standard CSS properties that could be exploited are removed. */
export const sanitizeIframeStyles = (iframe: HTMLIFrameElement): void => {
    const styles = iframe.getAttribute('style') ?? '';

    const props = styles
        .trim()
        .split(';')
        .map((decl) => first(decl.trim().toLowerCase().split(':')))
        .filter(truthy);

    props.forEach((prop) => {
        if (!prop.startsWith('--frame')) iframe.style.removeProperty(prop);
    });
};
