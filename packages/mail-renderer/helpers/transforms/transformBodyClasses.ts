import { unescape } from '@proton/shared/lib/sanitize/escape';

const SCRIPT_TAG_REGEX = /<script[^>]*>.*?<\/script>/gi;

export function transformBodyClasses(bodyClasses: string) {
    return unescape(bodyClasses)
        .replace(/\n/g, '') // Replace new lines with empty string
        .replace(SCRIPT_TAG_REGEX, ' ') // Replace script tags with a single space
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim();
}
