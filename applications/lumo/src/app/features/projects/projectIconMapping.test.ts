import { icons } from 'lucide-react';

import { DEFAULT_AGENT_ICON } from '../agents/constants';
import { PROJECT_ICONS } from './projectIconIds';
import { getProjectLucideIcon } from './projectIconMapping';

const DEFAULT_LUCIDE_ICON = 'Folder';

const expectRegisteredLucideIcon = (iconId: string | undefined) => {
    const lucideName = getProjectLucideIcon(iconId);
    expect(icons[lucideName]).toBeDefined();
    return lucideName;
};

describe('getProjectLucideIcon', () => {
    it('falls back when the id is missing or unknown', () => {
        expect(getProjectLucideIcon(undefined)).toBe(DEFAULT_LUCIDE_ICON);
        expect(getProjectLucideIcon('')).toBe(DEFAULT_LUCIDE_ICON);
        expect(getProjectLucideIcon('not-an-icon')).toBe(DEFAULT_LUCIDE_ICON);
    });

    it.each(PROJECT_ICONS)('maps picker icon %s to a registered Lucide icon', (iconId) => {
        const lucideName = expectRegisteredLucideIcon(iconId);
        if (iconId !== 'folder') {
            expect(lucideName).not.toBe(DEFAULT_LUCIDE_ICON);
        }
    });

    it('maps built-in agent icons and keyword-only ids', () => {
        expect(getProjectLucideIcon('key')).toBe('Key');
        expect(getProjectLucideIcon('chart-line')).toBe('ChartLine');
        expect(getProjectLucideIcon('pen-sparks')).toBe('WandSparkles');
        expect(getProjectLucideIcon('file-lines')).toBe('FileText');
        expect(getProjectLucideIcon('lock')).toBe('Lock');
        expect(getProjectLucideIcon('buildings')).toBe('BuildingComplex');
    });

    it('maps legacy persisted category ids', () => {
        expect(getProjectLucideIcon('health')).toBe('Heart');
        expect(getProjectLucideIcon('investing')).toBe('TrendingUp');
    });

    it('maps the default agent icon to Bot', () => {
        expect(getProjectLucideIcon(DEFAULT_AGENT_ICON)).toBe('Bot');
        expect(icons.Bot).toBeDefined();
    });
});
