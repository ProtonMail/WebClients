import tinycolor from 'tinycolor2';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { escape } from '@proton/sanitize/escape';
import { isPlainText } from '@proton/shared/lib/mail/messages';

import { exportPlainText, getPlainTextContent } from '../../helpers/message/messageContentPlainText';
import { getDocumentContent } from '../../helpers/message/messageContentQuery';

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

/** Inherited and overridable, so a descendant that restores them is visible: MJML wraps every column in `font-size:0`. */
const hidesOwnText = (style: CSSStyleDeclaration): boolean =>
    style.visibility !== 'visible' || parseFloat(style.fontSize) === 0;

const hidesSubtree = (style: CSSStyleDeclaration): boolean =>
    style.display === 'none' ||
    style.opacity === '0' ||
    isPushedOffscreen(style) ||
    isCollapsedToNothing(style) ||
    isClippedToNothing(style);

/**
 * Every translucent ancestor colour composited down to the nearest opaque one, or the canvas: read alone, a 2%
 * black tint scores as solid black. A background image must not suspend the check — an ancestor carrying one
 * was a bypass for white-on-white — so `background: #123 url(hero.png)` scores against #123, and artwork with
 * no colour behind it fails closed.
 */
const paintedBackground = (element: Element, styleOf: ComputedStyleReader): string => {
    const layers: tinycolor.Instance[] = [];
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const background = tinycolor(styleOf(ancestor).backgroundColor);
        if (!background.isValid() || background.getAlpha() === 0) {
            continue;
        }
        layers.push(background);
        if (background.getAlpha() === 1) {
            break;
        }
    }
    return layers
        .reduceRight(
            (below, layer) => tinycolor.mix(below, layer, layer.getAlpha() * 100),
            tinycolor(CANVAS_BACKGROUND)
        )
        .toRgbString();
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

/** Decide before mutating: removing a `<style>` withdraws rules the later elements are read against. */
const stripConcealed = (body: HTMLElement, view: Window): void => {
    const elements = [body, ...body.querySelectorAll<HTMLElement>('*')];
    if (elements.length > MAX_ELEMENTS) {
        // Fail closed: a tool error beats handing over an unchecked body.
        throw new Error(`Cannot read the email body: ${elements.length} elements is beyond what can be checked.`);
    }

    const styleOf = cachedStyleReader(view);
    const hidden: Element[] = [];
    const ownTextConcealed: HTMLElement[] = [];
    const styles: Element[] = [];

    elements.forEach((element) => {
        if (element.tagName === 'STYLE') {
            styles.push(element);
            return;
        }
        const style = styleOf(element);
        if (hidesSubtree(style)) {
            hidden.push(element);
            return;
        }
        if (hidesOwnText(style) || isUnreadable(element, styleOf)) {
            ownTextConcealed.push(element);
        }
    });

    // Turndown emits a style element's text content, so raw CSS would reach the model as prose.
    styles.forEach((style) => style.remove());
    // Own text only: a child that restores its colour, size or visibility is visible.
    ownTextConcealed.forEach((element) => {
        ownTextNodes(element).forEach((node) => node.remove());
        // `toText` drops an inline `visibility:hidden` subtree whole, the visible descendants with it.
        element.style.removeProperty('visibility');
    });
    // Detached, the body would still hand its content back to the caller holding it.
    hidden.forEach((element) => (element === body ? body.replaceChildren() : element.remove()));
};

/**
 * The renderer colours links from the theme (`MessageIframe.raw.scss`), so without this an uncoloured link is
 * scored in the browser's default blue. Mail's own root carries the same theme variables as the renderer's frame.
 */
const rendererLinkStyle = (): string => {
    const linkColor = getComputedStyle(document.documentElement).getPropertyValue('--interaction-norm').trim();
    return linkColor ? `<style>a{color:${linkColor}}a:not([href]){color:inherit!important}</style>` : '';
};

/** The parser hoists a leading `<style>` into `<head>`, which `getDocumentContent` drops — carry those rules across. */
const headStyles = (root: Element | undefined): string =>
    [...(root?.querySelector('head')?.querySelectorAll('style') ?? [])].map((style) => style.outerHTML).join('');

const BODY_ATTRIBUTES = ['class', 'style'];

/** `getDocumentContent` drops the `<body>` itself; the renderer carries its styling across on a wrapper. */
const bodyContent = (root: Element | undefined): string => {
    const content = getDocumentContent(root);
    const body = root?.querySelector('body');
    const attributes = BODY_ATTRIBUTES.flatMap((name) => {
        const value = body?.getAttribute(name);
        return value ? [`${name}="${escape(value)}"`] : [];
    });
    return attributes.length ? `<div ${attributes.join(' ')}>${content}</div>` : content;
};

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

/**
 * The model-facing body of an email, with text the reader could not see removed. Lumo-only: `toText` drives
 * the composer's downconvert, and that output must not change.
 */
export const toVisibleText = (message: MessageState): string => {
    if (isPlainText(message.data)) {
        return getPlainTextContent(message);
    }

    // Serialized, never the store's own document: the renderer draws from that tree.
    const stored = message.messageDocument?.document;
    // Renderer rules first, as in its frame, so the email's own rules still win at equal specificity.
    const html = rendererLinkStyle() + withoutRemoteLoads(headStyles(stored) + bodyContent(stored));
    const visible = inIsolatedDocument(html, (body, view) => {
        stripConcealed(body, view);
        return body.innerHTML;
    });

    if (visible === undefined) {
        // Fail closed: raw HTML would hand every concealed instruction over.
        throw new Error('Cannot read the email body: no isolated document to resolve the cascade in.');
    }

    return exportPlainText(visible).trim();
};
