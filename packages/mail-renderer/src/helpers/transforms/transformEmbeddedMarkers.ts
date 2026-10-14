/**
 * The composer tracks inline images through `data-embedded-img` and legacy `rel` attributes.
 * Remove the ones supplied by the sender so quoted content cannot impersonate composer state.
 * Legitimate markers are set by the application after rendering.
 */
export const transformEmbeddedMarkers = (document: Element) => {
    document.querySelectorAll('[data-embedded-img]').forEach((element) => {
        element.removeAttribute('data-embedded-img');
    });

    document.querySelectorAll('[rel]:not([href])').forEach((element) => {
        element.removeAttribute('rel');
    });
};
