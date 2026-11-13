import { getReducedMotion } from '@proton/components/hooks/useReducedMotion';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import {
    LUMO_EMOJI_IDS,
    type LumoEmojiId,
    getLumoEmojiName,
    getLumoEmojiSrc,
    getLumoEmojiStillSrc,
    getLumoEmojiToken,
} from './lumoEmojis';

interface EmojiMartSelection {
    id: string;
    native?: string;
}

const LUMO_CATEGORY_ID = 'lumo';

const NATIVE_CATEGORY_IDS = [
    'frequent',
    'people',
    'nature',
    'foods',
    'activity',
    'places',
    'objects',
    'symbols',
    'flags',
];

const CATEGORY_IDS_WITH_LUMO = [...NATIVE_CATEGORY_IDS, LUMO_CATEGORY_ID];

const getPickerEmojiId = (id: LumoEmojiId) => `lumo-${id}`;

const lumoEmojiTokenByPickerEmojiId = new Map(
    LUMO_EMOJI_IDS.map((id) => [getPickerEmojiId(id), getLumoEmojiToken(id)])
);

const createLumoCategory = () => {
    const getPickerImageSrc = getReducedMotion() ? getLumoEmojiStillSrc : getLumoEmojiSrc;

    return {
        id: LUMO_CATEGORY_ID,
        name: LUMO_SHORT_APP_NAME,
        icon: { src: lumoCatIcon },
        emojis: LUMO_EMOJI_IDS.map((id) => ({
            id: getPickerEmojiId(id),
            name: getLumoEmojiName(id),
            keywords: id.split('-'),
            skins: [{ src: getPickerImageSrc(id) }],
        })),
    };
};

let lumoCategory: ReturnType<typeof createLumoCategory> | undefined;

interface LumoEmojiPickerSettings {
    isLumoEmojisEnabled: boolean;
    showLumoSection: boolean;
}

export const getLumoEmojiPickerOptions = (
    onSelectText: (text: string) => void,
    { isLumoEmojisEnabled, showLumoSection }: LumoEmojiPickerSettings
) => ({
    ...(isLumoEmojisEnabled && {
        // emoji-mart keeps its categories in module state and only keeps the `custom` categories of the first
        // picker that opens, so every picker registers the Lumo emojis and only `categories` hides them.
        custom: [(lumoCategory ??= createLumoCategory())],
        categories: showLumoSection ? CATEGORY_IDS_WITH_LUMO : NATIVE_CATEGORY_IDS,
    }),
    onEmojiSelect: ({ id, native }: EmojiMartSelection) => {
        const text = native ?? lumoEmojiTokenByPickerEmojiId.get(id);

        if (text) {
            onSelectText(text);
        }
    },
});
