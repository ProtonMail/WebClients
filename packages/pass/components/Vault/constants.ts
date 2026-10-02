import type { IconComponent } from '@proton/icons/component';
import { IcPassAtom } from '@proton/icons/icons/IcPassAtom';
import { IcPassBasketball } from '@proton/icons/icons/IcPassBasketball';
import { IcPassBear } from '@proton/icons/icons/IcPassBear';
import { IcPassBook } from '@proton/icons/icons/IcPassBook';
import { IcPassBookmark } from '@proton/icons/icons/IcPassBookmark';
import { IcPassBox } from '@proton/icons/icons/IcPassBox';
import { IcPassCheque } from '@proton/icons/icons/IcPassCheque';
import { IcPassCircles } from '@proton/icons/icons/IcPassCircles';
import { IcPassCream } from '@proton/icons/icons/IcPassCream';
import { IcPassCreditCard } from '@proton/icons/icons/IcPassCreditCard';
import { IcPassFire } from '@proton/icons/icons/IcPassFire';
import { IcPassFish } from '@proton/icons/icons/IcPassFish';
import { IcPassFlower } from '@proton/icons/icons/IcPassFlower';
import { IcPassGift } from '@proton/icons/icons/IcPassGift';
import { IcPassGroup } from '@proton/icons/icons/IcPassGroup';
import { IcPassHeart } from '@proton/icons/icons/IcPassHeart';
import { IcPassHome } from '@proton/icons/icons/IcPassHome';
import { IcPassJson } from '@proton/icons/icons/IcPassJson';
import { IcPassLaptop } from '@proton/icons/icons/IcPassLaptop';
import { IcPassLeaf } from '@proton/icons/icons/IcPassLeaf';
import { IcPassLock } from '@proton/icons/icons/IcPassLock';
import { IcPassMushroom } from '@proton/icons/icons/IcPassMushroom';
import { IcPassPacman } from '@proton/icons/icons/IcPassPacman';
import { IcPassShield } from '@proton/icons/icons/IcPassShield';
import { IcPassShop } from '@proton/icons/icons/IcPassShop';
import { IcPassShoppingCart } from '@proton/icons/icons/IcPassShoppingCart';
import { IcPassSmile } from '@proton/icons/icons/IcPassSmile';
import { IcPassStar } from '@proton/icons/icons/IcPassStar';
import { IcPassWallet } from '@proton/icons/icons/IcPassWallet';
import { IcPassWork } from '@proton/icons/icons/IcPassWork';

import { VaultColor, VaultIcon } from '../../types/protobuf/vault-v1.static';

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

export const VAULT_ICON_MAP: Record<number, IconComponent> = {
    [VaultIcon.ICON_UNSPECIFIED]: IcPassHome,
    [VaultIcon.ICON_CUSTOM]: IcPassHome,
    [VaultIcon.ICON1]: IcPassHome,
    [VaultIcon.ICON2]: IcPassWork,
    [VaultIcon.ICON3]: IcPassGift,
    [VaultIcon.ICON4]: IcPassShop,
    [VaultIcon.ICON5]: IcPassHeart,
    [VaultIcon.ICON6]: IcPassBear,
    [VaultIcon.ICON7]: IcPassCircles,
    [VaultIcon.ICON8]: IcPassFlower,
    [VaultIcon.ICON9]: IcPassGroup,
    [VaultIcon.ICON10]: IcPassPacman,
    [VaultIcon.ICON11]: IcPassShoppingCart,
    [VaultIcon.ICON12]: IcPassLeaf,
    [VaultIcon.ICON13]: IcPassShield,
    [VaultIcon.ICON14]: IcPassBasketball,
    [VaultIcon.ICON15]: IcPassCreditCard,
    [VaultIcon.ICON16]: IcPassFish,
    [VaultIcon.ICON17]: IcPassSmile,
    [VaultIcon.ICON18]: IcPassLock,
    [VaultIcon.ICON19]: IcPassMushroom,
    [VaultIcon.ICON20]: IcPassStar,
    [VaultIcon.ICON21]: IcPassFire,
    [VaultIcon.ICON22]: IcPassWallet,
    [VaultIcon.ICON23]: IcPassBookmark,
    [VaultIcon.ICON24]: IcPassCream,
    [VaultIcon.ICON25]: IcPassLaptop,
    [VaultIcon.ICON26]: IcPassJson,
    [VaultIcon.ICON27]: IcPassBook,
    [VaultIcon.ICON28]: IcPassBox,
    [VaultIcon.ICON29]: IcPassAtom,
    [VaultIcon.ICON30]: IcPassCheque,
};

export const VAULT_ICONS = numericEntries(VAULT_ICON_MAP);
