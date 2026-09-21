const SLIDE_PAGE_CLASS = 'artifact-slide-page';

/** Extract top-level slide `<section>` fragments from model slide content. */
export function extractPresentationSlideFragments(slideContent: string): string[] {
    const trimmed = slideContent.trim();
    if (!trimmed) {
        return [];
    }

    const doc = new DOMParser().parseFromString(`<!doctype html><body>${trimmed}</body>`, 'text/html');
    const topLevelSections = Array.from(doc.body.children).filter((node) => {
        return node.tagName.toLowerCase() === 'section';
    });

    if (topLevelSections.length === 0) {
        return [`<section class="${SLIDE_PAGE_CLASS}">${trimmed}</section>`];
    }

    return topLevelSections.map((section) => {
        section.classList.add(SLIDE_PAGE_CLASS);
        return section.outerHTML;
    });
}

/** Build stacked slide HTML for static PDF export (no reveal.js runtime). */
export function buildPresentationSlidesHtml(slideContent: string): string {
    return extractPresentationSlideFragments(slideContent).join('\n');
}
