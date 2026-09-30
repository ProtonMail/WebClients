const SLIDE_PAGE_CLASS = 'artifact-slide-page';

function isSectionElement(node: Element): boolean {
    return node.tagName.toLowerCase() === 'section';
}

function toSlidePage(section: Element): string {
    section.classList.add(SLIDE_PAGE_CLASS);
    return section.outerHTML;
}

// A top-level `<section>` holding nested `<section>`s is a reveal.js vertical stack: each nested
// section is its own slide in the preview, so export gives each one its own page too. Any content
// the model put directly in the stack (outside the nested sections) becomes a leading slide rather
// than being dropped.
function expandVerticalStack(stack: Element): string[] {
    const nestedSections = Array.from(stack.children).filter(isSectionElement);
    if (nestedSections.length === 0) {
        return [toSlidePage(stack)];
    }

    nestedSections.forEach((section) => {
        section.remove();
    });

    const leadingSlides = stack.textContent?.trim() || stack.children.length > 0 ? [toSlidePage(stack)] : [];

    return [
        ...leadingSlides,
        ...nestedSections.map((section) => {
            return toSlidePage(section);
        }),
    ];
}

/** Extract one `<section>` fragment per slide (vertical sub-slides included) from model slide content. */
export function extractPresentationSlideFragments(slideContent: string): string[] {
    const trimmed = slideContent.trim();
    if (!trimmed) {
        return [];
    }

    const doc = new DOMParser().parseFromString(`<!doctype html><body>${trimmed}</body>`, 'text/html');
    const topLevelSections = Array.from(doc.body.children).filter(isSectionElement);

    if (topLevelSections.length === 0) {
        return [`<section class="${SLIDE_PAGE_CLASS}">${trimmed}</section>`];
    }

    return topLevelSections.flatMap((section) => {
        return expandVerticalStack(section);
    });
}

/** Build stacked slide HTML for static PDF export (no reveal.js runtime). */
export function buildPresentationSlidesHtml(slideContent: string): string {
    return extractPresentationSlideFragments(slideContent).join('\n');
}
