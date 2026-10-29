import { base64ToMasterKey, generateMasterKeyBase64, generateSkillKeyBase64 } from '../../crypto';
import { deserializeSkill, serializeSkill } from './skillSerialization';
import type { Skill } from './types';

describe('skill serialization', () => {
    it('keeps the plugin index through an encrypt/decrypt round trip', async () => {
        const masterKey = await base64ToMasterKey(generateMasterKeyBase64());
        const skill: Skill = {
            id: 'skill-1',
            createdAt: '2026-10-23T00:00:00.000Z',
            updatedAt: '2026-10-23T00:00:00.000Z',
            skillKey: generateSkillKeyBase64(),
            name: 'design',
            description: 'Design plugin',
            instructions: '',
            enabled: true,
            source: 'uploaded',
            subSkills: [{ path: 'skills/ux-copy', name: 'ux-copy', description: 'Copy', enabled: false }],
            plugin: { version: '1.2.0', author: 'Anthropic' },
            connectors: [{ name: 'figma', url: 'https://mcp.figma.com/mcp' }],
            connectorCategories: [{ name: 'Design', placeholder: '~~design', included: ['Figma'], alternatives: [] }],
            bundleIndexVersion: 3,
        };

        const serialized = await serializeSkill(skill, masterKey);
        const restored = await deserializeSkill(serialized, { primary: masterKey, legacy: [] });

        expect(restored).toMatchObject({
            subSkills: skill.subSkills,
            plugin: skill.plugin,
            connectors: skill.connectors,
            connectorCategories: skill.connectorCategories,
            bundleIndexVersion: 3,
        });
    });

    it('recovers legacyAgentId from the encrypted part, which is all the server stores', async () => {
        const masterKey = await base64ToMasterKey(generateMasterKeyBase64());
        const skill: Skill = {
            id: 'skill-2',
            createdAt: '2026-10-23T00:00:00.000Z',
            updatedAt: '2026-10-23T00:00:00.000Z',
            legacyAgentId: 'agent-1',
            skillKey: generateSkillKeyBase64(),
            name: 'translator',
            description: 'Translates',
            instructions: 'Translate',
            enabled: true,
            source: 'custom-lumo',
        };

        const { legacyAgentId, ...fromServer } = await serializeSkill(skill, masterKey);
        expect(legacyAgentId).toBe('agent-1');

        const restored = await deserializeSkill(fromServer, { primary: masterKey, legacy: [] });

        expect(restored?.legacyAgentId).toBe('agent-1');
    });
});
