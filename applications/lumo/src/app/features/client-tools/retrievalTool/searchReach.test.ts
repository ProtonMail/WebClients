import { type Space, SpaceType } from '../../../types';
import { resolveSearchReach } from './searchReach';

const base = { id: 'space', createdAt: '2026-01-01', updatedAt: '2026-01-01', spaceKey: 'key' };
const project = (overrides: object = {}) => ({ ...base, spaceType: SpaceType.Project, ...overrides }) as Space;
const simple = { ...base, spaceType: SpaceType.Default } as Space;

describe('resolveSearchReach', () => {
    it('is off by default', () => {
        expect(resolveSearchReach({}, undefined)).toEqual({ chatSearch: 'none', searchOtherSpaces: false });
        expect(resolveSearchReach({}, project())).toEqual({ chatSearch: 'none', searchOtherSpaces: false });
    });

    it("follows the user's settings when the project doesn't choose", () => {
        const settings = { conversationSearch: 'all', isCrossProjectSearchEnabled: true } as const;

        expect(resolveSearchReach(settings, project())).toEqual({ chatSearch: 'all', searchOtherSpaces: true });
        expect(resolveSearchReach(settings, simple)).toEqual({ chatSearch: 'all', searchOtherSpaces: true });
    });

    it("lets the project's choice win, in both directions", () => {
        expect(
            resolveSearchReach(
                { conversationSearch: 'all', isCrossProjectSearchEnabled: false },
                project({ chatSearch: 'project', searchOtherProjects: true })
            )
        ).toEqual({ chatSearch: 'project', searchOtherSpaces: true });
    });

    it('searches no other chats with "same project only" outside a project', () => {
        expect(resolveSearchReach({ conversationSearch: 'project' }, simple).chatSearch).toBe('none');
        expect(resolveSearchReach({ conversationSearch: 'project' }, project()).chatSearch).toBe('project');
    });
});
