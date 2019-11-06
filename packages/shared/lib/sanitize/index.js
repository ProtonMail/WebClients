import DOMPurify from 'dompurify';

export const sanitizeString = (str) => DOMPurify.sanitize(str) + '';
