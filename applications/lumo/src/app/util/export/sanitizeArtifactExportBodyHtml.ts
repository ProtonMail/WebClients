import type { Config } from 'dompurify';
import DOMPurify from 'dompurify';

const EXPORT_URI_REGEXP =
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

const EXPORT_BODY_SANITIZE_CONFIG: Config = {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'meta', 'link', 'base', 'style'],
    FORBID_ATTR: ['srcset'],
    ALLOWED_URI_REGEXP: EXPORT_URI_REGEXP,
};

/** Sanitize model-generated HTML fragments before they are mounted for PDF/PPTX export. */
export function sanitizeArtifactExportBodyHtml(html: string): string {
    return DOMPurify.sanitize(html, EXPORT_BODY_SANITIZE_CONFIG) as string;
}
