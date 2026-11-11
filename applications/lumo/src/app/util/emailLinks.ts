import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

// Route even malformed mailto links to the email warning, where parsing can reject them.
export const isEmailLink = (url: string) => /^mailto:/i.test(url.trim());

/** Only hand off fields that the confirmation can display, using the same decoded values. */
export const parseEmailLink = (url: string) => {
    try {
        const value = url.trim();
        // Require spaces and literal # characters to be encoded; raw fragments are not email fields.
        if (!isEmailLink(value) || /[\u0000-\u0020\u007f]/.test(value) || value.includes('#')) {
            return null;
        }

        // Split before decoding so encoded ? and & characters remain part of field values.
        const separator = value.indexOf('?');
        const address = value.slice(7, separator === -1 ? undefined : separator);
        const query = separator === -1 ? '' : value.slice(separator + 1);
        const fields = new Map<string, string>();
        for (const part of query ? query.split('&') : []) {
            const equals = part.indexOf('=');
            if (equals === -1) {
                return null;
            }
            // Unlike URLSearchParams, this preserves literal + characters in aliases and message text.
            const name = decodeURIComponent(part.slice(0, equals)).toLowerCase();
            const content = decodeURIComponent(part.slice(equals + 1));
            // Reject hidden fields and ambiguous duplicates instead of guessing how an email app handles them.
            if (!['to', 'cc', 'bcc', 'subject', 'body'].includes(name) || fields.has(name)) {
                return null;
            }
            // Header line breaks could add recipients or fields not shown in the preview.
            // The body may contain tabs and line breaks, but no other ASCII control characters.
            const controls =
                name === 'body' ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
            if (controls.test(content)) {
                return null;
            }
            fields.set(name, content);
        }

        const recipients = (content: string) => (content ? content.split(',').map((item) => item.trim()) : []);
        // mailto supports To recipients both before the query and in its to field; preview both together.
        const to = [...recipients(decodeURIComponent(address)), ...recipients(fields.get('to') ?? '')];
        const cc = recipients(fields.get('cc') ?? '');
        const bcc = recipients(fields.get('bcc') ?? '');
        // Accept bare addresses only; display names and invisible formatting could disguise recipients.
        if (
            [...to, ...cc, ...bcc].some(
                (item) => /[\s<>\p{Cf}\u0000-\u001f\u007f]/u.test(item) || !validateEmailAddress(item)
            )
        ) {
            return null;
        }

        const subject = fields.get('subject') ?? '';
        const body = fields.get('body') ?? '';
        // Rebuild from the validated preview values so unreviewed fields cannot reach the email app.
        // Encode each value again so its delimiters cannot become additional parameters.
        const parameters = [
            ['cc', cc.join(',')],
            ['bcc', bcc.join(',')],
            ['subject', subject],
            ['body', body],
        ]
            .filter(([, content]) => content !== '')
            .map(([name, content]) => `${name}=${encodeURIComponent(content)}`);
        const href = `mailto:${to.map((item) => encodeURIComponent(item)).join(',')}${parameters.length ? `?${parameters.join('&')}` : ''}`;
        return { to, cc, bcc, subject, body, href };
    } catch {
        // Malformed percent escapes or UTF-8 sequences make decodeURIComponent throw.
        return null;
    }
};
