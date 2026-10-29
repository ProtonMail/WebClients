import type { DesktopConnector, DesktopConnectorCatalog } from '@proton/lumo-api-client/core/desktop-tools';

import { getDesktopCategory } from './connectorCategories';
import { formatSkillConnectorMap, matchSkillConnectors } from './connectorMatching';
import type { SkillConnectorCategory } from './types';

const manifest = (id: string, display_name: string, extra: Partial<DesktopConnector> = {}): DesktopConnector => ({
    id,
    display_name,
    enabled: true,
    readiness: { state: 'ready' },
    status: { state: 'ready' },
    ...extra,
});

const catalog: DesktopConnectorCatalog = {
    categories: [],
    connectors: [
        {
            id: 'mcp-slack',
            server_id: 'slack',
            category: 'communication',
            name: 'Slack',
            description: '',
            url: 'https://mcp.slack.com/mcp',
        },
        { id: 'mcp-atlassian', server_id: 'atlassian', category: 'work', name: 'Atlassian Rovo', description: '' },
        { id: 'mcp-grafana', server_id: 'grafana', category: 'observability', name: 'Grafana', description: '' },
        { id: 'mcp-figma', server_id: 'figma', category: 'work', name: 'Figma', description: '' },
    ],
};

const category = (
    name: string,
    placeholder: string,
    included: string[],
    alternatives: string[] = []
): SkillConnectorCategory => ({ name, placeholder, included, alternatives });

const engineering = [
    category('Chat', '~~chat', ['Slack'], ['Microsoft Teams']),
    category('Project tracker', '~~project tracker', ['Linear', 'Atlassian (Jira/Confluence)']),
    category('Monitoring', '~~monitoring', ['Datadog'], ['New Relic']),
    category('CI/CD', '~~CI/CD', [], ['CircleCI']),
];

describe('getDesktopCategory', () => {
    it('maps placeholders, then category names, onto desktop categories', () => {
        expect(getDesktopCategory({ name: 'Chat', placeholder: '~~chat' })).toBe('communication');
        expect(getDesktopCategory({ name: 'CI/CD', placeholder: '~~CI/CD' })).toBe('developer');
        expect(getDesktopCategory({ name: 'Incident management' })).toBe('observability');
        expect(getDesktopCategory({ name: 'Data warehouse', placeholder: '~~data warehouse' })).toBe('data');
        expect(getDesktopCategory({ name: 'HRIS', placeholder: '~~HRIS' })).toBeUndefined();
    });
});

describe('matchSkillConnectors', () => {
    it('matches by server id, aliases in parentheses and the catalog', () => {
        const { categories } = matchSkillConnectors(
            { connectorCategories: engineering },
            { manifests: [manifest('mcp-slack', 'Slack', { server_id: 'slack' })], catalog }
        );
        expect(categories[0].connectors).toEqual([
            { name: 'Slack', status: 'connected', connectorId: 'mcp-slack', desktopName: 'Slack' },
        ]);
        expect(categories[1].connectors).toEqual([
            { name: 'Linear', status: 'unavailable' },
            {
                name: 'Atlassian (Jira/Confluence)',
                status: 'available',
                connectorId: 'mcp-atlassian',
                desktopName: 'Atlassian Rovo',
            },
        ]);
    });

    it('falls back to connected connectors in the same desktop category', () => {
        const { categories } = matchSkillConnectors(
            { connectorCategories: engineering },
            { manifests: [manifest('mcp-grafana', 'Grafana', { category: 'observability' })], catalog }
        );
        const monitoring = categories[2];
        expect(monitoring.connectors).toEqual([{ name: 'Datadog', status: 'unavailable' }]);
        expect(monitoring.otherConnected.map(({ connectorId }) => connectorId)).toEqual(['mcp-grafana']);
    });

    it('suggests catalog connectors in the category that are not added yet', () => {
        const { categories } = matchSkillConnectors(
            { connectorCategories: [category('Design', '~~design', ['Sketch'])] },
            { manifests: [], catalog }
        );
        expect(categories[0].suggested.map(({ connectorId }) => connectorId)).toEqual(['mcp-atlassian', 'mcp-figma']);
    });

    it('needs attention when the connector is turned off or not signed in', () => {
        const { categories } = matchSkillConnectors(
            { connectorCategories: [category('Chat', '~~chat', ['Slack'])] },
            {
                manifests: [manifest('mcp-slack', 'Slack', { status: { state: 'not_ready', reason: 'x' } })],
                catalog,
            }
        );
        expect(categories[0].connectors[0].status).toBe('needs-attention');

        const disabled = matchSkillConnectors(
            { connectorCategories: [category('Chat', '~~chat', ['Slack'])] },
            { manifests: [manifest('mcp-slack', 'Slack', { enabled: false })], catalog }
        );
        expect(disabled.categories[0].connectors[0].status).toBe('needs-attention');
    });

    it('works with desktop builds that send no catalog, category, server id or url', () => {
        const { categories } = matchSkillConnectors(
            { connectorCategories: [category('Chat', '~~chat', ['Slack'])] },
            { manifests: [manifest('mcp-slack', 'Slack workspace')], catalog: { categories: [], connectors: [] } }
        );
        expect(categories[0].connectors[0]).toMatchObject({ status: 'connected', connectorId: 'mcp-slack' });
    });

    it('lists .mcp.json servers no category names, matching by name before url host', () => {
        const { servers } = matchSkillConnectors(
            {
                connectors: [
                    { name: 'slack', url: 'https://mcp.slack.com/mcp' },
                    { name: 'team-chat', url: 'https://mcp.slack.com/mcp' },
                    { name: 'figma' },
                ],
                connectorCategories: [category('Design', '~~design', ['Figma'])],
            },
            { manifests: [manifest('mcp-workspace', 'Workspace', { url: 'https://mcp.slack.com/mcp' })], catalog }
        );
        expect(servers).toEqual([
            { name: 'slack', status: 'available', connectorId: 'mcp-slack', desktopName: 'Slack' },
            { name: 'team-chat', status: 'connected', connectorId: 'mcp-workspace', desktopName: 'Workspace' },
        ]);
    });

    it('shows nothing as connected on the web', () => {
        const { categories, servers } = matchSkillConnectors(
            { connectors: [{ name: 'slack' }], connectorCategories: engineering },
            { manifests: [], catalog: { categories: [], connectors: [] } }
        );
        expect(categories.flatMap((match) => match.connectors).every(({ status }) => status === 'unavailable')).toBe(
            true
        );
        expect(servers).toEqual([]);
    });
});

describe('formatSkillConnectorMap', () => {
    it('lists connected tools per placeholder, and says when none is connected', () => {
        const matches = matchSkillConnectors(
            { connectorCategories: engineering },
            {
                manifests: [
                    manifest('mcp-slack', 'Slack'),
                    manifest('mcp-grafana', 'Grafana', { category: 'observability' }),
                ],
                catalog,
            }
        );
        expect(formatSkillConnectorMap(matches)).toBe(
            [
                "When this skill needs one of these kinds of tool, or writes its ~~placeholder, use the user's connected tools for it:",
                '- ~~chat: Slack (tools mcp-slack__*)',
                '- ~~project tracker: none connected. Ask the user, or continue without it.',
                '- ~~monitoring: Grafana (tools mcp-grafana__*)',
                '- ~~CI/CD: none connected. Ask the user, or continue without it.',
            ].join('\n')
        );
    });

    it('is empty when the plugin has no placeholders', () => {
        expect(formatSkillConnectorMap({ categories: [], servers: [] })).toBeUndefined();
        const matches = matchSkillConnectors(
            { connectorCategories: [{ name: 'Chat', included: ['Slack'], alternatives: [] }] },
            { manifests: [manifest('mcp-slack', 'Slack')], catalog }
        );
        expect(formatSkillConnectorMap(matches)).toBeUndefined();
    });
});
