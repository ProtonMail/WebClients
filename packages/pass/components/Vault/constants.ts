import type { IconName } from '@proton/components';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';

const numericEntries = <T extends Record<number, any>>(
    obj: T
): [number, T extends Record<any, infer U> ? U : never][] =>
    Object.keys(obj).map((key) => [Number(key), obj[Number(key)]]);

export const VAULT_COLOR_MAP: Record<number, string> = {
    [VaultColor.COLOR_UNSPECIFIED]: 'var(--vault-unspecified)',
    [VaultColor.COLOR_CUSTOM]: 'var(--vault-custom)',
    [VaultColor.COLOR1]: 'var(--vault-heliotrope)',
    [VaultColor.COLOR2]: 'var(--vault-mauvelous)',
    [VaultColor.COLOR3]: 'var(--vault-marigold-yellow)',
    [VaultColor.COLOR4]: 'var(--vault-de-york)',
    [VaultColor.COLOR5]: 'var(--vault-jordy-blue)',
    [VaultColor.COLOR6]: 'var(--vault-lavender-magenta)',
    [VaultColor.COLOR7]: 'var(--vault-chestnut-rose)',
    [VaultColor.COLOR8]: 'var(--vault-porsche)',
    [VaultColor.COLOR9]: 'var(--vault-mercury)',
    [VaultColor.COLOR10]: 'var(--vault-water-leaf)',
};

export const VAULT_COLORS = numericEntries(VAULT_COLOR_MAP);

export const VAULT_ICON_MAP: Record<number, IconName> = {
    [VaultIcon.ICON_UNSPECIFIED]: 'pass-home',
    [VaultIcon.ICON_CUSTOM]: 'pass-home',
    [VaultIcon.ICON1]: 'pass-home',
    [VaultIcon.ICON2]: 'pass-work',
    [VaultIcon.ICON3]: 'pass-gift',
    [VaultIcon.ICON4]: 'pass-shop',
    [VaultIcon.ICON5]: 'pass-heart',
    [VaultIcon.ICON6]: 'pass-bear',
    [VaultIcon.ICON7]: 'pass-circles',
    [VaultIcon.ICON8]: 'pass-flower',
    [VaultIcon.ICON9]: 'pass-group',
    [VaultIcon.ICON10]: 'pass-pacman',
    [VaultIcon.ICON11]: 'pass-shopping-cart',
    [VaultIcon.ICON12]: 'pass-leaf',
    [VaultIcon.ICON13]: 'pass-shield',
    [VaultIcon.ICON14]: 'pass-basketball',
    [VaultIcon.ICON15]: 'pass-credit-card',
    [VaultIcon.ICON16]: 'pass-fish',
    [VaultIcon.ICON17]: 'pass-smile',
    [VaultIcon.ICON18]: 'pass-lock',
    [VaultIcon.ICON19]: 'pass-mushroom',
    [VaultIcon.ICON20]: 'pass-star',
    [VaultIcon.ICON21]: 'pass-fire',
    [VaultIcon.ICON22]: 'pass-wallet',
    [VaultIcon.ICON23]: 'pass-bookmark',
    [VaultIcon.ICON24]: 'pass-cream',
    [VaultIcon.ICON25]: 'pass-laptop',
    [VaultIcon.ICON26]: 'pass-json',
    [VaultIcon.ICON27]: 'pass-book',
    [VaultIcon.ICON28]: 'pass-box',
    [VaultIcon.ICON29]: 'pass-atom',
    [VaultIcon.ICON30]: 'pass-cheque',
};

export const VAULT_ICONS = numericEntries(VAULT_ICON_MAP);
