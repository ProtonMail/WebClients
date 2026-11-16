import {
    deriveBundleInfo,
    hasRootSkillMarkdown,
    parseConnectorsMarkdown,
    parseMcpConnectors,
    parsePluginManifest,
    resolvePluginInfo,
} from './skillBundle';
import { encodeText } from './skillFiles';
import type { SkillFileDraft } from './types';

const file = (path: string, text: string): SkillFileDraft => ({ path, mimeType: 'text/plain', data: encodeText(text) });

describe('resolvePluginInfo', () => {
    const fromFiles = { version: '2.0.0', author: 'Anthropic' };
    const stored = { version: '1.0.0', author: 'Proton' };

    it('prefers the manifest in the files', () => {
        expect(resolvePluginInfo('proton', fromFiles, stored)).toEqual(fromFiles);
    });

    it('keeps the stored info only for Proton plugins', () => {
        expect(resolvePluginInfo('proton', undefined, stored)).toEqual(stored);
        expect(resolvePluginInfo('uploaded', undefined, stored)).toBeUndefined();
    });
});

describe('parsePluginManifest', () => {
    it('reads name, version, description and author', () => {
        expect(
            parsePluginManifest('{"name":"design","version":"1.2.0","description":"D","author":{"name":"Anthropic"}}')
        ).toEqual({ name: 'design', version: '1.2.0', description: 'D', author: 'Anthropic' });
    });

    it('prefers the OpenAI display fields of Codex and Agent Plugins manifests', () => {
        const display = { displayName: 'Docs Helper', shortDescription: 'Find answers', developerName: 'OpenAI' };
        const expected = { name: 'Docs Helper', version: '1.0.0', description: 'Find answers', author: 'OpenAI' };
        expect(
            parsePluginManifest(JSON.stringify({ name: 'docs-helper', version: '1.0.0', interface: display }))
        ).toEqual(expected);
        expect(
            parsePluginManifest(
                JSON.stringify({
                    name: 'docs-helper',
                    version: '1.0.0',
                    extensions: { 'com.openai': { interface: display } },
                })
            )
        ).toEqual(expected);
    });

    it('returns undefined for invalid JSON', () => {
        expect(parsePluginManifest('{nope')).toBeUndefined();
    });
});

describe('ChatGPT plugin layouts', () => {
    const skill = file('skills/docs-search/SKILL.md', '---\nname: docs-search\ndescription: Search\n---\n');
    const server = { docs: { type: 'streamable-http', url: 'https://example.com/mcp' } };

    it('reads a Codex plugin', () => {
        const info = deriveBundleInfo([
            file('.codex-plugin/plugin.json', '{"name":"docs","version":"1.0.0","mcpServers":"./.mcp.json"}'),
            file('.mcp.json', JSON.stringify({ mcpServers: server })),
            skill,
        ]);
        expect(info.plugin).toEqual({ version: '1.0.0', author: undefined });
        expect(info.connectors).toEqual([{ name: 'docs', url: 'https://example.com/mcp' }]);
    });

    it('reads a portable plugin with root mcp.json or inline servers', () => {
        const manifest = '{"$schema":"https://agent-plugins.org/schemas/1.0.0/plugin.schema.json","version":"0.1.0"}';
        const withFile = deriveBundleInfo([
            file('plugin.json', manifest),
            file('mcp.json', JSON.stringify({ mcpServers: server })),
        ]);
        const inline = deriveBundleInfo([
            file('plugin.json', JSON.stringify({ version: '0.1.0', mcpServers: server })),
            skill,
        ]);
        expect(withFile.plugin?.version).toBe('0.1.0');
        expect(withFile.connectors).toHaveLength(1);
        expect(inline.connectors).toEqual([{ name: 'docs', url: 'https://example.com/mcp' }]);
    });

    it('ignores an unrelated root plugin.json in a single skill', () => {
        expect(deriveBundleInfo([file('plugin.json', '{"version":"9"}')]).plugin).toBeUndefined();
    });
});

describe('parseMcpConnectors', () => {
    it('keeps names and https URLs only', () => {
        expect(
            parseMcpConnectors(
                JSON.stringify({
                    mcpServers: {
                        figma: { type: 'http', url: 'https://mcp.figma.com/mcp' },
                        local: { type: 'http', url: 'http://localhost:3000' },
                        gmail: { type: 'http', url: '' },
                    },
                })
            )
        ).toEqual([
            { name: 'figma', url: 'https://mcp.figma.com/mcp' },
            { name: 'local', url: undefined },
            { name: 'gmail', url: undefined },
        ]);
    });
});

describe('deriveBundleInfo', () => {
    const files = [
        file('.claude-plugin/plugin.json', '{"name":"design","version":"1.2.0","author":{"name":"Anthropic"}}'),
        file('.mcp.json', '{"mcpServers":{"figma":{"url":"https://mcp.figma.com/mcp"}}}'),
        file(
            'CONNECTORS.md',
            '| Category | Placeholder | Included servers | Other options |\n|---|---|---|---|\n| Design | `~~design` | Figma | Sketch |\n'
        ),
        file('skills/ux-copy/SKILL.md', '---\nname: ux-copy\ndescription: Copy\n---\n'),
        file('skills/a11y/SKILL.md', '---\nname: accessibility-review\ndescription: Audit\n---\n'),
    ];

    it('derives plugin info, sub-skills and connectors', () => {
        expect(deriveBundleInfo(files)).toEqual({
            plugin: { version: '1.2.0', author: 'Anthropic' },
            connectors: [{ name: 'figma', url: 'https://mcp.figma.com/mcp' }],
            connectorCategories: [
                { name: 'Design', placeholder: '~~design', included: ['Figma'], alternatives: ['Sketch'] },
            ],
            subSkills: [
                { path: 'skills/a11y', name: 'accessibility-review', description: 'Audit', enabled: true },
                { path: 'skills/ux-copy', name: 'ux-copy', description: 'Copy', enabled: true },
            ],
            bundleIndexVersion: 3,
        });
    });

    it('keeps previous on/off choices by path', () => {
        const previous = [{ path: 'skills/ux-copy', name: 'old', description: '', enabled: false }];
        expect(deriveBundleInfo(files, previous).subSkills?.find((s) => s.path === 'skills/ux-copy')?.enabled).toBe(
            false
        );
    });

    it('leaves plain skills alone', () => {
        expect(deriveBundleInfo([file('notes.md', 'hi')])).toEqual({
            plugin: undefined,
            connectors: undefined,
            connectorCategories: undefined,
            subSkills: undefined,
            bundleIndexVersion: 3,
        });
    });
});

describe('parseConnectorsMarkdown', () => {
    const engineering = `# Connectors

## How tool references work

Plugin files use \`~~category\` as a placeholder.

| Category | Placeholder | Included servers | Other options |
|----------|-------------|-----------------|---------------|
| Chat | \`~~chat\` | Slack | Microsoft Teams |
| Source control | \`~~source control\` | GitHub | GitLab, Bitbucket |
| Project tracker | \`~~project tracker\` | Linear, Asana, Atlassian (Jira/Confluence) | Shortcut, ClickUp |
| CI/CD | \`~~CI/CD\` | — | CircleCI, GitHub Actions |

More text after the table.
`;

    it('reads the Engineering plugin table', () => {
        expect(parseConnectorsMarkdown(engineering)).toEqual([
            { name: 'Chat', placeholder: '~~chat', included: ['Slack'], alternatives: ['Microsoft Teams'] },
            {
                name: 'Source control',
                placeholder: '~~source control',
                included: ['GitHub'],
                alternatives: ['GitLab', 'Bitbucket'],
            },
            {
                name: 'Project tracker',
                placeholder: '~~project tracker',
                included: ['Linear', 'Asana', 'Atlassian (Jira/Confluence)'],
                alternatives: ['Shortcut', 'ClickUp'],
            },
            { name: 'CI/CD', placeholder: '~~CI/CD', included: [], alternatives: ['CircleCI', 'GitHub Actions'] },
        ]);
    });

    it('keeps commas inside parentheses and strips links and emphasis', () => {
        const text =
            '| Category | Placeholder | Included servers | Other options |\n|---|---|---|---|\n| Tracker | **~~tracker** | Atlassian (Jira, Confluence), [Linear](https://linear.app) | n/a |';
        expect(parseConnectorsMarkdown(text)).toEqual([
            {
                name: 'Tracker',
                placeholder: '~~tracker',
                included: ['Atlassian (Jira, Confluence)', 'Linear'],
                alternatives: [],
            },
        ]);
    });

    it('drops escaped footnote markers', () => {
        const text =
            '| Category | Placeholder | Included servers | Other options |\n|---|---|---|---|\n| Data warehouse | `~~data warehouse` | Snowflake\\*, Databricks\\*, BigQuery | Redshift |';
        expect(parseConnectorsMarkdown(text)[0].included).toEqual(['Snowflake', 'Databricks', 'BigQuery']);
    });

    it('ignores tables without category and placeholder columns', () => {
        expect(parseConnectorsMarkdown('| Name | Url |\n|---|---|\n| Slack | x |')).toEqual([]);
        expect(parseConnectorsMarkdown('No table here')).toEqual([]);
    });

    it('drops placeholders that are not ~~ references and handles missing columns', () => {
        expect(parseConnectorsMarkdown('| Category | Placeholder |\n|---|---|\n| Chat | chat |')).toEqual([
            { name: 'Chat', placeholder: undefined, included: [], alternatives: [] },
        ]);
    });

    it('caps rows and names', () => {
        const rows = Array.from({ length: 40 }, (_, i) => `| C${i} | \`~~c${i}\` | ${'x'.repeat(300)} | |`);
        const parsed = parseConnectorsMarkdown(
            ['| Category | Placeholder | Included | Other |', '|---|---|---|---|', ...rows].join('\n')
        );
        expect(parsed).toHaveLength(30);
        expect(parsed[0].included[0]).toHaveLength(128);
    });
});

describe('hasRootSkillMarkdown', () => {
    it('is false only for plugins without root instructions', () => {
        expect(hasRootSkillMarkdown({ instructions: '' })).toBe(true);
        expect(hasRootSkillMarkdown({ instructions: '', plugin: {} })).toBe(false);
        expect(hasRootSkillMarkdown({ instructions: 'Root', plugin: {} })).toBe(true);
    });
});
