import tinycolor from 'tinycolor2';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { escapeRegex } from '@proton/shared/lib/helpers/regex';
import { isPlainText } from '@proton/shared/lib/mail/messages';

import { exportPlainText, getPlainTextContent } from '../../helpers/message/messageContentPlainText';
import { getDocumentContent } from '../../helpers/message/messageContentQuery';
import { HIDDEN_MARKER } from './hiddenMarker';

/** Far below the 4.5 accessibility floor: unreadable, not merely low-contrast. */
const UNREADABLE_CONTRAST = 1.5;

const CANVAS_BACKGROUND = '#ffffff';

/** Outside any viewport, and beyond what a real layout nudges by. */
const OFFSCREEN_OFFSET = -500;

const OFFSET_PROPERTIES = ['left', 'top', 'right', 'bottom'] as const;

/** One style resolution per node, so an adversarial body could otherwise stall the main thread. */
const MAX_ELEMENTS = 10_000;

type ComputedStyleReader = (element: Element) => CSSStyleDeclaration;

/** `paintedBackground` re-reads every ancestor of every element it scores. */
const cachedStyleReader = (view: Window): ComputedStyleReader => {
    const resolved = new Map<Element, CSSStyleDeclaration>();
    return (element) => {
        const cached = resolved.get(element);
        if (cached) {
            return cached;
        }
        const style = view.getComputedStyle(element);
        resolved.set(element, style);
        return style;
    };
};

/** Margins pull without a positioning context, unlike the offsets. */
const PULL_PROPERTIES = ['marginLeft', 'marginTop'] as const;

const TRANSFORM_FUNCTION = /([a-z0-9]+)\(([^()]*)\)/gi;

/**
 * Painting nothing is a zero determinant, not a zero `scaleX` — `rotate(90deg)` has both. `matrix3d` is
 * column-major, so its submatrix and translation sit at different indexes.
 */
const isDegenerateMatrix = (values: number[]): boolean => {
    const is3d = values.length === 16;
    const [scaleX, skewY, skewX, scaleY] = is3d
        ? [values[0], values[1], values[4], values[5]]
        : [values[0], values[1], values[2], values[3]];
    const [translateX, translateY] = is3d ? [values[12], values[13]] : [values[4], values[5]];
    return scaleX * scaleY - skewY * skewX === 0 || translateX <= OFFSCREEN_OFFSET || translateY <= OFFSCREEN_OFFSET;
};

/** A browser computes the whole list down to one `matrix()`; jsdom leaves the authored functions, so read both. */
const isTransformedAway = (transform: string): boolean => {
    if (!transform || transform === 'none') {
        return false;
    }
    for (const [, name, args] of transform.matchAll(TRANSFORM_FUNCTION)) {
        const values = args.split(',').map((value) => parseFloat(value));
        const method = name.toLowerCase();
        if (method.startsWith('matrix')) {
            if (isDegenerateMatrix(values)) {
                return true;
            }
            continue;
        }
        if (method.startsWith('scale') && values.some((value) => value === 0)) {
            return true;
        }
        if (method.startsWith('translate') && values.some((value) => value <= OFFSCREEN_OFFSET)) {
            return true;
        }
    }
    return false;
};

const CLIP_RECT = /^rect\((.+)\)$/;

/** The screen-reader idiom, whose `1px` variant paints nothing either. */
const isClippedToNothing = (style: CSSStyleDeclaration): boolean => {
    const edges = CLIP_RECT.exec(style.getPropertyValue('clip'))?.[1];
    if (edges && edges.split(/[,\s]+/).every((edge) => parseFloat(edge) <= 1)) {
        return true;
    }
    return style.getPropertyValue('clip-path').startsWith('inset(100%');
};

/** Off the cascade, not off geometry: the frame is offscreen, so no rect is worth measuring. */
const isPushedOffscreen = (style: CSSStyleDeclaration): boolean =>
    parseFloat(style.textIndent) <= OFFSCREEN_OFFSET ||
    PULL_PROPERTIES.some((property) => parseFloat(style[property]) <= OFFSCREEN_OFFSET) ||
    (style.position !== 'static' &&
        OFFSET_PROPERTIES.some((property) => parseFloat(style[property]) <= OFFSCREEN_OFFSET)) ||
    isTransformedAway(style.getPropertyValue('transform'));

const isCollapsedToNothing = (style: CSSStyleDeclaration): boolean =>
    style.overflow === 'hidden' &&
    [style.height, style.maxHeight, style.width, style.maxWidth].some((size) => parseFloat(size) === 0);

const isHiddenByStyle = (style: CSSStyleDeclaration): boolean =>
    style.display === 'none' ||
    style.visibility !== 'visible' ||
    style.opacity === '0' ||
    parseFloat(style.fontSize) === 0 ||
    isPushedOffscreen(style) ||
    isCollapsedToNothing(style) ||
    isClippedToNothing(style);

/**
 * The nearest opaque ancestor colour, since an element's own is transparent unless set. A background image
 * must not suspend the check — an ancestor carrying one was a bypass for white-on-white — so
 * `background: #123 url(hero.png)` scores against #123, and artwork with no colour behind it fails closed.
 */
const paintedBackground = (element: Element, styleOf: ComputedStyleReader): string => {
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const background = tinycolor(styleOf(ancestor).backgroundColor);
        if (background.isValid() && background.getAlpha() > 0) {
            return background.toRgbString();
        }
    }
    return CANVAS_BACKGROUND;
};

const ownTextNodes = (element: Element): Text[] =>
    [...element.childNodes].filter(
        (node): node is Text => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim()
    );

/** Unparseable is not invisible: jsdom reports `canvastext`, which tinycolor rejects. */
const isUnreadable = (element: Element, styleOf: ComputedStyleReader): boolean => {
    const color = tinycolor(styleOf(element).color);
    if (!color.isValid()) {
        return false;
    }
    const background = paintedBackground(element, styleOf);
    // `readability` ignores alpha, so `transparent` scores 21:1 until the colour is composited onto its background.
    const painted = tinycolor.mix(background, color, color.getAlpha() * 100);
    return tinycolor.readability(painted, background) < UNREADABLE_CONTRAST;
};

const MARKER_LITERAL = new RegExp(escapeRegex(HIDDEN_MARKER), 'g');

const withoutSpoofedMarkers = (text: string): string => text.replace(MARKER_LITERAL, '');

/** A sender could otherwise fake concealment. Text nodes, so an entity-encoded copy is caught too. */
const removeSpoofedMarkers = (body: HTMLElement): void => {
    const walker = body.ownerDocument.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.textContent?.includes(HIDDEN_MARKER)) {
            node.textContent = withoutSpoofedMarkers(node.textContent);
        }
    }
};

const replaceWithMarker = (node: ChildNode): void =>
    node.replaceWith(node.ownerDocument!.createTextNode(` ${HIDDEN_MARKER} `));

/** Decide before mutating: removing a `<style>` withdraws rules the later elements are read against. */
const stripConcealed = (body: HTMLElement, view: Window): void => {
    removeSpoofedMarkers(body);

    const elements = body.querySelectorAll('*');
    if (elements.length > MAX_ELEMENTS) {
        // Fail closed: a tool error beats handing over an unchecked body.
        throw new Error(`Cannot read the email body: ${elements.length} elements is beyond what can be checked.`);
    }

    const styleOf = cachedStyleReader(view);
    const hidden: Element[] = [];
    const unreadable: Element[] = [];
    const styles: Element[] = [];

    elements.forEach((element) => {
        if (element.tagName === 'STYLE') {
            styles.push(element);
            return;
        }
        if (isHiddenByStyle(styleOf(element))) {
            // A hidden spacer holding only an <img> concealed nothing and must not warn.
            if (element.textContent?.trim()) {
                hidden.push(element);
            }
            return;
        }
        if (isUnreadable(element, styleOf)) {
            unreadable.push(element);
        }
    });

    // Turndown emits a style element's text content, so raw CSS would reach the model as prose.
    styles.forEach((style) => style.remove());
    // Own text only: a child that sets the colour back to readable is visible.
    unreadable.forEach((element) => ownTextNodes(element).forEach(replaceWithMarker));
    hidden.forEach(replaceWithMarker);
};

/** The parser hoists a leading `<style>` into `<head>`, which `getDocumentContent` drops — carry those rules across. */
const headStyles = (root: Element | undefined): string =>
    [...(root?.querySelector('head')?.querySelectorAll('style') ?? [])].map((style) => style.outerHTML).join('');

const LOADING_ATTRIBUTES = ['src', 'srcset', 'poster', 'background'];

const CSS_URL = /url\([^()]*\)/gi;

/**
 * Assigning a loaded remote URL into an iframe re-fires the sender's tracking pixels. Defuse `url()` rather
 * than erase it: a background image still has to be detectable for the contrast check.
 */
const withoutRemoteLoads = (html: string): string => {
    // Wrapped, or a leading <style> is hoisted out of the fragment.
    const root = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').body.firstElementChild;
    if (!root) {
        return '';
    }
    root.querySelectorAll('link').forEach((link) => link.remove());
    root.querySelectorAll('*').forEach((element) => {
        LOADING_ATTRIBUTES.forEach((attribute) => {
            const value = element.getAttribute(attribute);
            if (value === null) {
                return;
            }
            element.removeAttribute(attribute);
            if (!element.hasAttribute(`proton-${attribute}`)) {
                element.setAttribute(`proton-${attribute}`, value);
            }
        });
        const style = element.getAttribute('style');
        if (style) {
            element.setAttribute('style', style.replace(CSS_URL, 'url(#)'));
        }
        if (element.tagName === 'STYLE') {
            element.textContent = (element.textContent ?? '').replace(CSS_URL, 'url(#)');
        }
    });
    return root.innerHTML;
};

/**
 * An offscreen iframe, so the browser runs the cascade. A detached document resolves inline styles only;
 * the live document resolves everything but leaks the email's `<style>` globally.
 */
const inIsolatedDocument = <T>(html: string, read: (body: HTMLElement, view: Window) => T): T | undefined => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.setAttribute('aria-hidden', 'true');
    // Real dimensions, or `width:100%` resolves against a 0px viewport and reads as collapsed.
    iframe.style.cssText = 'position:absolute;width:800px;height:600px;border:0;left:-9999px;top:-9999px';
    document.body.appendChild(iframe);
    try {
        const view = iframe.contentWindow;
        if (!view?.document.body) {
            return undefined;
        }
        view.document.body.innerHTML = html;
        return read(view.document.body, view);
    } finally {
        iframe.remove();
    }
};

const MARKER_RUN = new RegExp(`(?:${escapeRegex(HIDDEN_MARKER)}\\s*){2,}`, 'g');

const collapseMarkers = (text: string): string => text.replace(MARKER_RUN, `${HIDDEN_MARKER}\n`).trim();

/**
 * The model-facing body of an email, with text the reader could not see removed and marked. Lumo-only:
 * `toText` drives the composer's downconvert, and that output must not change.
 */
export const toVisibleText = (message: MessageState): string => {
    if (isPlainText(message.data)) {
        return withoutSpoofedMarkers(getPlainTextContent(message));
    }

    // Serialized, never the store's own document: the renderer draws from that tree.
    const stored = message.messageDocument?.document;
    const html = withoutRemoteLoads(headStyles(stored) + getDocumentContent(stored));
    const visible = inIsolatedDocument(html, (body, view) => {
        stripConcealed(body, view);
        return body.innerHTML;
    });

    if (visible === undefined) {
        // Fail closed: raw HTML would hand every concealed instruction over unmarked.
        throw new Error('Cannot read the email body: no isolated document to resolve the cascade in.');
    }

    return collapseMarkers(exportPlainText(visible));
};
