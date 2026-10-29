export type CustomizeTab = 'skills' | 'connectors';

/** Within the skills tab: the user's own skills, or ready-made ones to add. */
export type SkillsView = 'yours' | 'discover';

export const parseCustomizeTab = (value: string | null): CustomizeTab =>
    value === 'connectors' ? 'connectors' : 'skills';

export const parseSkillsView = (value: string | null): SkillsView => (value === 'discover' ? 'discover' : 'yours');

export const getCustomizeSearch = (tab: CustomizeTab, view: SkillsView = 'yours'): string => {
    if (tab === 'connectors') {
        return '?tab=connectors';
    }
    return view === 'discover' ? '?view=discover' : '';
};
