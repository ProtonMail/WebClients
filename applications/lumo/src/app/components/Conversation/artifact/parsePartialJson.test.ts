import { parsePartialFlatJsonStringObject } from './parsePartialJson';

describe('parsePartialFlatJsonStringObject', () => {
    it('returns nothing before the object has started', () => {
        expect(parsePartialFlatJsonStringObject('')).toEqual({ fields: {} });
        expect(parsePartialFlatJsonStringObject('{')).toEqual({ fields: {} });
    });

    it('extracts closed fields and leaves the in-progress one as partial', () => {
        const raw = '{"id":"abc","type":"code","title":"Fib","content":"def fib(n):\\n    ret';
        const result = parsePartialFlatJsonStringObject(raw);

        expect(result.fields).toEqual({ id: 'abc', type: 'code', title: 'Fib' });
        expect(result.partial).toEqual({ key: 'content', value: 'def fib(n):\n    ret' });
    });

    it('grows the partial value as more characters stream in, byte by byte', () => {
        const full = '{"id":"x","type":"document","title":"Note","content":"line one\\nline two"}';
        let lastContent = '';
        for (let end = 1; end <= full.length; end++) {
            const { fields, partial } = parsePartialFlatJsonStringObject(full.slice(0, end));
            const content = partial?.key === 'content' ? partial.value : (fields.content ?? lastContent);
            // Content must never shrink or get corrupted as more of the stream arrives.
            expect(content.length).toBeGreaterThanOrEqual(lastContent.length);
            lastContent = content;
        }
        expect(lastContent).toBe('line one\nline two');
    });

    it('resolves all fields once the object is fully closed', () => {
        const raw = '{"id":"abc","type":"code","language":"python","title":"Fib","content":"print(1)"}';
        const result = parsePartialFlatJsonStringObject(raw);

        expect(result.fields).toEqual({
            id: 'abc',
            type: 'code',
            language: 'python',
            title: 'Fib',
            content: 'print(1)',
        });
        expect(result.partial).toBeUndefined();
    });

    it('handles a value containing an escaped quote without ending the string early', () => {
        const raw = '{"id":"x","type":"code","title":"if x > y","content":"print(\\"hi\\")"}';
        const result = parsePartialFlatJsonStringObject(raw);

        expect(result.fields.title).toBe('if x > y');
        expect(result.fields.content).toBe('print("hi")');
    });

    it('does not include a trailing incomplete escape sequence in the partial value', () => {
        // Stream cut off mid-escape (`\` not yet followed by its escape character).
        const raw = '{"id":"x","type":"code","title":"T","content":"line one\\';
        const { partial } = parsePartialFlatJsonStringObject(raw);

        expect(partial).toEqual({ key: 'content', value: 'line one' });
    });

    it('does not include a trailing incomplete unicode escape in the partial value', () => {
        const raw = '{"id":"x","type":"code","title":"T","content":"abc\\u00';
        const { partial } = parsePartialFlatJsonStringObject(raw);

        expect(partial).toEqual({ key: 'content', value: 'abc' });
    });

    it('decodes a completed unicode escape', () => {
        const raw = '{"id":"x","type":"code","title":"T","content":"snowman \\u2603"}';
        const { fields } = parsePartialFlatJsonStringObject(raw);

        expect(fields.content).toBe('snowman ☃');
    });
});
