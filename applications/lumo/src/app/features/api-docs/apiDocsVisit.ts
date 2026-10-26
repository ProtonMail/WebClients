const API_DOCS_VISITED_STORAGE_KEY = 'lumo-api-docs-visited';

export const hasVisitedApiDocs = () => {
    try {
        return localStorage.getItem(API_DOCS_VISITED_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
};

export const markApiDocsVisited = () => {
    try {
        localStorage.setItem(API_DOCS_VISITED_STORAGE_KEY, '1');
    } catch {
        // Storage may be unavailable; navigation should continue to work.
    }
};
