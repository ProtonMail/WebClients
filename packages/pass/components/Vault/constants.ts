import type { IconName } from '@proton/components';
import type { ColorRGB } from '@proton/pass/types';
import { VaultColor, VaultIcon } from '@proton/pass/types/protobuf/vault-v1';

const numericEntries = <T extends Record<number, any>>(
    obj: T
): [number, T extends Record<any, infer U> ? U : never][] =>
    Object.keys(obj).map((key) => [Number(key), obj[Number(key)]]);

export const VAULT_COLOR_MAP: Record<number, ColorRGB> = {
    [VaultColor.COLOR_UNSPECIFIED]: '140 140 147',
    [VaultColor.COLOR_CUSTOM]: '167 121 255',
    [VaultColor.COLOR1]: '167 121 255',
    [VaultColor.COLOR2]: '242 146 146',
    [VaultColor.COLOR3]: '247 215 117',
    [VaultColor.COLOR4]: '145 199 153',
    [VaultColor.COLOR5]: '146 179 242',
    [VaultColor.COLOR6]: '235 141 214',
    [VaultColor.COLOR7]: '205 90 111',
    [VaultColor.COLOR8]: '228 163 103',
    [VaultColor.COLOR9]: '230 230 230',
    [VaultColor.COLOR10]: '158 226 230',
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
