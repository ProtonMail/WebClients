import { shouldRenderAsVegaChart } from './detectVegaSpec';
import {
    blockContainsCompleteCodeFence,
    parseMarkdownCodeFence,
    splitMarkdownWithCompleteCodeFences,
} from './parseMarkdownCodeFence';

describe('parseMarkdownCodeFence', () => {
    it('parses a complete fenced block', () => {
        const block = '```json\n{\n  "$schema": "https://vega.github.io/schema/vega-lite/v5.json"\n}\n```\n\n';

        expect(parseMarkdownCodeFence(block)).toEqual({
            language: 'json',
            code: '{\n  "$schema": "https://vega.github.io/schema/vega-lite/v5.json"\n}',
        });
    });

    it('splits prose and code in one block', () => {
        const content = 'Here is the chart:\n\n```vega-lite\n{"mark":"bar"}\n```\n';
        const segments = splitMarkdownWithCompleteCodeFences(content);

        expect(segments).toHaveLength(3);
        expect(segments[0]).toMatchObject({ type: 'markdown' });
        expect(segments[1]).toMatchObject({ type: 'code', language: 'vega-lite' });
        expect(segments[2]).toMatchObject({ type: 'markdown' });
    });

    it('detects vega specs in complete fences for direct rendering', () => {
        const block = parseMarkdownCodeFence(
            '```json\n{"$schema":"https://vega.github.io/schema/vega-lite/v5.json","data":{"values":[{"month":"Jan"}]},"title":{"text":"Geneva"}}\n```\n\n'
        );

        expect(block).not.toBeNull();
        expect(shouldRenderAsVegaChart(block!.language, block!.code)).toBe(true);
        expect(blockContainsCompleteCodeFence('```json\n{}\n```')).toBe(true);
    });

    it('splits all fences after blockContainsCompleteCodeFence (global regex lastIndex)', () => {
        const metricFence = (title: string) =>
            `\`\`\`card\n${JSON.stringify({ type: 'metric', title, value: '1', direction: 'up' })}\n\`\`\``;
        const content = `# KPIs\n\n${metricFence('A')}\n\n${metricFence('B')}`;

        expect(blockContainsCompleteCodeFence(content)).toBe(true);

        const segments = splitMarkdownWithCompleteCodeFences(content);
        expect(segments.filter((segment) => segment.type === 'code')).toHaveLength(2);
    });

    it('preserves an inner triple-backtick fence inside a four-backtick fence', () => {
        const content = ['````markdown', '# Example', '', '```js', 'const value = 1;', '```', '````'].join('\n');

        expect(parseMarkdownCodeFence(content)).toEqual({
            language: 'markdown',
            code: ['# Example', '', '```js', 'const value = 1;', '```'].join('\n'),
        });
    });

    it('does not treat an inner fence as complete while its outer fence is streaming', () => {
        const content = ['````markdown', '```js', 'const value = 1;', '```'].join('\n');

        expect(blockContainsCompleteCodeFence(content)).toBe(false);
        expect(splitMarkdownWithCompleteCodeFences(content)).toEqual([{ type: 'markdown', content }]);
    });

    it('rejects backticks in a backtick fence info string', () => {
        const content = ['```markdown`invalid', 'content', '```'].join('\n');

        expect(parseMarkdownCodeFence(content)).toBeNull();
        expect(blockContainsCompleteCodeFence(content)).toBe(false);
    });

    it('continues to parse a standalone fence surrounded by blank lines', () => {
        const content = '\n\n```json\n{}\n```\n\n';

        expect(parseMarkdownCodeFence(content)).toEqual({ language: 'json', code: '{}' });
    });
});
