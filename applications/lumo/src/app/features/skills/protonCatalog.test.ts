import { getDesktopCategory } from './connectorCategories';
import { getProtonPlugins, protonPluginMatches, protonPluginToDraft } from './protonCatalog';
import { deriveBundleInfo } from './skillBundle';
import { decodeText } from './skillFiles';
import { SKILL_DESCRIPTION_MAX_LENGTH, getSkillHandle, parseSkillMarkdown } from './skillMarkdown';

describe('getProtonPlugins', () => {
    const plugins = getProtonPlugins();
    const skills = plugins.flatMap((plugin) => plugin.skills);

    it('has unique plugin ids', () => {
        expect(new Set(plugins.map(({ id }) => id)).size).toBe(plugins.length);
    });

    it('has skill names that are valid handles and unique across all plugins', () => {
        for (const { name } of skills) {
            expect(getSkillHandle(name)).toBe(name);
        }
        expect(new Set(skills.map(({ name }) => name)).size).toBe(skills.length);
    });

    it('has an example for every plugin', () => {
        for (const plugin of plugins) {
            expect(plugin.getExample().length).toBeGreaterThan(0);
        }
    });

    it('has a description and instructions for every skill', () => {
        for (const { description, instructions } of skills) {
            expect(description.length).toBeGreaterThan(0);
            expect(description.length).toBeLessThanOrEqual(SKILL_DESCRIPTION_MAX_LENGTH);
            expect(instructions.trim().length).toBeGreaterThan(0);
        }
    });
});

describe('protonPluginToDraft', () => {
    const [plugin] = getProtonPlugins();
    const draft = protonPluginToDraft(plugin);

    it('builds a Proton plugin keyed by its id', () => {
        expect(draft).toMatchObject({ source: 'proton', legacyAgentId: plugin.id, instructions: '' });
    });

    it('produces files that index as a plugin with every skill', () => {
        const info = deriveBundleInfo(draft.files);
        expect(info.plugin).toEqual({ version: plugin.version, author: 'Proton' });
        expect(info.subSkills?.map(({ name }) => name).sort()).toEqual(plugin.skills.map(({ name }) => name).sort());
    });

    it('indexes every plugin connector category from CONNECTORS.md', () => {
        for (const each of getProtonPlugins()) {
            const { connectorCategories } = deriveBundleInfo(protonPluginToDraft(each).files);
            expect(connectorCategories).toEqual(
                each.connectors.map(({ category, placeholder, included, alternatives = [] }) => ({
                    name: category,
                    placeholder,
                    included,
                    alternatives,
                }))
            );
        }
    });

    it('only uses connector categories Lumo Desktop has', () => {
        for (const { connectors } of getProtonPlugins()) {
            for (const { category, placeholder } of connectors) {
                expect(getDesktopCategory({ name: category, placeholder })).toBeDefined();
            }
        }
    });

    it('round-trips descriptions and instructions through SKILL.md', () => {
        const [skill] = plugin.skills;
        const file = draft.files.find(({ path }) => path === `skills/${skill.name}/SKILL.md`);
        const parsed = parseSkillMarkdown(decodeText(file!.data));
        expect(parsed.frontmatter.description).toBe(skill.description);
        expect(parsed.body).toBe(skill.instructions.trim());
    });
});

describe('protonPluginMatches', () => {
    const [plugin] = getProtonPlugins();

    it('matches the title and skill names, ignoring case', () => {
        expect(protonPluginMatches(plugin, '')).toBe(true);
        expect(protonPluginMatches(plugin, plugin.getTitle().toUpperCase())).toBe(true);
        expect(protonPluginMatches(plugin, plugin.skills[0].name)).toBe(true);
        expect(protonPluginMatches(plugin, 'no-such-skill-xyz')).toBe(false);
    });
});
