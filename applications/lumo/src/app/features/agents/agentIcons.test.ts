import { IcChartLine } from '@proton/icons/icons/IcChartLine';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcPassHeart } from '@proton/icons/icons/IcPassHeart';
import { IcRobot } from '@proton/icons/icons/IcRobot';

import { PROJECT_ICONS } from '../projects/projectIconIds';
import { getAgentIconComponent } from './agentIcons';
import { DEFAULT_AGENT_ICON } from './constants';
import { getDefaultAgents } from './defaultAgents';

describe('getAgentIconComponent', () => {
    it('falls back to the robot when no icon is set', () => {
        expect(getAgentIconComponent(undefined)).toBe(IcRobot);
        expect(getAgentIconComponent('')).toBe(IcRobot);
        expect(getAgentIconComponent(DEFAULT_AGENT_ICON)).toBe(IcRobot);
    });

    it('resolves canonical and keyword-derived ids directly', () => {
        expect(getAgentIconComponent('chart-line')).toBe(IcChartLine);
        expect(getAgentIconComponent('key')).toBe(IcKey);
        expect(getAgentIconComponent('lock')).toBe(IcLock);
    });

    it('resolves legacy category ids through their canonical alias', () => {
        expect(getAgentIconComponent('health')).toBe(IcPassHeart);
    });

    it('falls back to the robot for unknown ids', () => {
        expect(getAgentIconComponent('not-an-icon')).toBe(IcRobot);
        expect(getAgentIconComponent('toString')).toBe(IcRobot);
    });

    it('covers every icon the picker offers and every built-in agent icon', () => {
        const ids = [...PROJECT_ICONS, ...getDefaultAgents().map((agent) => agent.icon)];

        ids.forEach((id) => {
            if (id && id !== DEFAULT_AGENT_ICON) {
                expect(getAgentIconComponent(id)).not.toBe(IcRobot);
            }
        });
    });
});
