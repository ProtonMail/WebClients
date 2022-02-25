import DOMPurify from 'dompurify';

export const onlyStrong = (source: string) => {
    return DOMPurify.sanitize(source, {
        ALLOWED_TAGS: ['strong', 'b'],
        ALLOWED_ATTR: [],
    });
};
