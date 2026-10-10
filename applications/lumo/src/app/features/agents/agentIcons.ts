import type { IconComponent } from '@proton/icons/component';
import { IcBank } from '@proton/icons/icons/IcBank';
import { IcBolt } from '@proton/icons/icons/IcBolt';
import { IcBookmark } from '@proton/icons/icons/IcBookmark';
import { IcBuildings } from '@proton/icons/icons/IcBuildings';
import { IcCalendarCells } from '@proton/icons/icons/IcCalendarCells';
import { IcCamera } from '@proton/icons/icons/IcCamera';
import { IcChartLine } from '@proton/icons/icons/IcChartLine';
import { IcCode } from '@proton/icons/icons/IcCode';
import { IcEarth } from '@proton/icons/icons/IcEarth';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcFire } from '@proton/icons/icons/IcFire';
import { IcFolder } from '@proton/icons/icons/IcFolder';
import { IcHeart } from '@proton/icons/icons/IcHeart';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcLanguage } from '@proton/icons/icons/IcLanguage';
import { IcLightbulb } from '@proton/icons/icons/IcLightbulb';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcMobile } from '@proton/icons/icons/IcMobile';
import { IcMoneyBills } from '@proton/icons/icons/IcMoneyBills';
import { IcPaintRoller } from '@proton/icons/icons/IcPaintRoller';
import { IcPalette } from '@proton/icons/icons/IcPalette';
import { IcPassAtom } from '@proton/icons/icons/IcPassAtom';
import { IcPassBasketball } from '@proton/icons/icons/IcPassBasketball';
import { IcPassBear } from '@proton/icons/icons/IcPassBear';
import { IcPassBook } from '@proton/icons/icons/IcPassBook';
import { IcPassCream } from '@proton/icons/icons/IcPassCream';
import { IcPassFish } from '@proton/icons/icons/IcPassFish';
import { IcPassFlower } from '@proton/icons/icons/IcPassFlower';
import { IcPassGift } from '@proton/icons/icons/IcPassGift';
import { IcPassHeart } from '@proton/icons/icons/IcPassHeart';
import { IcPassHome } from '@proton/icons/icons/IcPassHome';
import { IcPassLeaf } from '@proton/icons/icons/IcPassLeaf';
import { IcPassPacman } from '@proton/icons/icons/IcPassPacman';
import { IcPassShop } from '@proton/icons/icons/IcPassShop';
import { IcPassShoppingCart } from '@proton/icons/icons/IcPassShoppingCart';
import { IcPassWork } from '@proton/icons/icons/IcPassWork';
import { IcPenSparks } from '@proton/icons/icons/IcPenSparks';
import { IcPresentationScreen } from '@proton/icons/icons/IcPresentationScreen';
import { IcRobot } from '@proton/icons/icons/IcRobot';
import { IcRocket } from '@proton/icons/icons/IcRocket';
import { IcSliders } from '@proton/icons/icons/IcSliders';
import { IcSun } from '@proton/icons/icons/IcSun';
import { IcTv } from '@proton/icons/icons/IcTv';
import { IcUsersMerge } from '@proton/icons/icons/IcUsersMerge';
import { IcWallet } from '@proton/icons/icons/IcWallet';
import { IcWindowTerminal } from '@proton/icons/icons/IcWindowTerminal';
import { IcWrench } from '@proton/icons/icons/IcWrench';

import type { ProjectIconId } from '../projects/projectIconIds';
import { isKnownProjectIcon, normalizeProjectIconId } from '../projects/projectIconMapping';

/**
 * Ids outside `PROJECT_ICONS` that agents can still be given: `getIconFromAgentName` picks them from
 * the agent's name, and the built-in Account Assistant uses `key`.
 */
type AgentKeywordIconId = 'buildings' | 'heart' | 'key' | 'lock' | 'paint-roller' | 'sliders';

/**
 * Stored agent icon ids → Proton icon component.
 * Covers every id the icon picker offers, plus the keyword-derived ids above.
 */
const AGENT_ICON_COMPONENTS: Record<ProjectIconId | AgentKeywordIconId, IconComponent> = {
    folder: IcFolder,
    'file-lines': IcFileLines,
    'calendar-cells': IcCalendarCells,
    'pass-work': IcPassWork,
    'presentation-screen': IcPresentationScreen,

    code: IcCode,
    'window-terminal': IcWindowTerminal,
    'users-merge': IcUsersMerge,
    robot: IcRobot,
    rocket: IcRocket,
    bolt: IcBolt,
    wrench: IcWrench,

    palette: IcPalette,
    'pen-sparks': IcPenSparks,
    camera: IcCamera,
    'pass-atom': IcPassAtom,

    bank: IcBank,
    wallet: IcWallet,
    'money-bills': IcMoneyBills,
    'pass-shopping-cart': IcPassShoppingCart,
    'pass-shop': IcPassShop,

    mobile: IcMobile,
    tv: IcTv,
    language: IcLanguage,

    'chart-line': IcChartLine,
    lightbulb: IcLightbulb,

    earth: IcEarth,
    'pass-leaf': IcPassLeaf,
    'pass-flower': IcPassFlower,
    'pass-fish': IcPassFish,
    'pass-bear': IcPassBear,
    'pass-cream': IcPassCream,
    sun: IcSun,
    fire: IcFire,

    'pass-home': IcPassHome,
    'pass-heart': IcPassHeart,
    'pass-gift': IcPassGift,
    'pass-book': IcPassBook,
    bookmark: IcBookmark,

    'pass-basketball': IcPassBasketball,
    'pass-pacman': IcPassPacman,

    buildings: IcBuildings,
    heart: IcHeart,
    key: IcKey,
    lock: IcLock,
    'paint-roller': IcPaintRoller,
    sliders: IcSliders,
};

const isAgentIconId = (iconId: string): iconId is keyof typeof AGENT_ICON_COMPONENTS =>
    Object.hasOwn(AGENT_ICON_COMPONENTS, iconId);

/**
 * Resolve a stored agent icon id to its Proton icon component.
 * Legacy category ids (e.g. `health`) resolve through their canonical alias; missing or unknown ids
 * fall back to the robot.
 */
export const getAgentIconComponent = (iconId?: string): IconComponent => {
    if (!iconId) {
        return IcRobot;
    }

    if (isAgentIconId(iconId)) {
        return AGENT_ICON_COMPONENTS[iconId];
    }

    if (isKnownProjectIcon(iconId)) {
        const normalizedId = normalizeProjectIconId(iconId);
        if (isAgentIconId(normalizedId)) {
            return AGENT_ICON_COMPONENTS[normalizedId];
        }
    }

    return IcRobot;
};
