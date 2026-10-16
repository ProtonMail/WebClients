import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import alertGif from '@proton/styles/assets/img/meet/lumo-emojis/alert.gif';
import browseFoldersGif from '@proton/styles/assets/img/meet/lumo-emojis/browse-folders.gif';
import cashGif from '@proton/styles/assets/img/meet/lumo-emojis/cash.gif';
import cheersGif from '@proton/styles/assets/img/meet/lumo-emojis/cheers.gif';
import chefsKissGif from '@proton/styles/assets/img/meet/lumo-emojis/chefs-kiss.gif';
import cowboyGif from '@proton/styles/assets/img/meet/lumo-emojis/cowboy.gif';
import encryptGif from '@proton/styles/assets/img/meet/lumo-emojis/encrypt.gif';
import gamingGif from '@proton/styles/assets/img/meet/lumo-emojis/gaming.gif';
import haloGif from '@proton/styles/assets/img/meet/lumo-emojis/halo.gif';
import happyGif from '@proton/styles/assets/img/meet/lumo-emojis/happy.gif';
import loveGif from '@proton/styles/assets/img/meet/lumo-emojis/love.gif';
import mildPanicGif from '@proton/styles/assets/img/meet/lumo-emojis/mild-panic.gif';
import nineLivesGif from '@proton/styles/assets/img/meet/lumo-emojis/nine-lives.gif';
import partyGif from '@proton/styles/assets/img/meet/lumo-emojis/party.gif';
import perkGif from '@proton/styles/assets/img/meet/lumo-emojis/perk.gif';
import protonGif from '@proton/styles/assets/img/meet/lumo-emojis/proton.gif';
import rocketGif from '@proton/styles/assets/img/meet/lumo-emojis/rocket.gif';
import schrodingerInBoxGif from '@proton/styles/assets/img/meet/lumo-emojis/schrodinger-in-box.gif';
import schrodingerOutOfBoxGif from '@proton/styles/assets/img/meet/lumo-emojis/schrodinger-out-of-box.gif';
import searchGif from '@proton/styles/assets/img/meet/lumo-emojis/search.gif';
import sitGif from '@proton/styles/assets/img/meet/lumo-emojis/sit.gif';
import slayGif from '@proton/styles/assets/img/meet/lumo-emojis/slay.gif';
import sweepGif from '@proton/styles/assets/img/meet/lumo-emojis/sweep.gif';
import thinkGif from '@proton/styles/assets/img/meet/lumo-emojis/think.gif';
import thisIsFineGif from '@proton/styles/assets/img/meet/lumo-emojis/this-is-fine.gif';
import watchLeftGif from '@proton/styles/assets/img/meet/lumo-emojis/watch-left.gif';
import watchRightGif from '@proton/styles/assets/img/meet/lumo-emojis/watch-right.gif';
import writeGif from '@proton/styles/assets/img/meet/lumo-emojis/write.gif';

interface LumoEmojiDefinition {
    src: string;
    getName: () => string;
}

const LUMO_EMOJI_DEFINITIONS = {
    alert: { src: alertGif, getName: () => c('Lumo emoji name').t`Alert` },
    'browse-folders': { src: browseFoldersGif, getName: () => c('Lumo emoji name').t`Browse folders` },
    cash: { src: cashGif, getName: () => c('Lumo emoji name').t`Cash` },
    cheers: { src: cheersGif, getName: () => c('Lumo emoji name').t`Cheers` },
    'chefs-kiss': { src: chefsKissGif, getName: () => c('Lumo emoji name').t`Chef's kiss` },
    cowboy: { src: cowboyGif, getName: () => c('Lumo emoji name').t`Cowboy` },
    encrypt: { src: encryptGif, getName: () => c('Lumo emoji name').t`Encrypt` },
    gaming: { src: gamingGif, getName: () => c('Lumo emoji name').t`Gaming` },
    halo: { src: haloGif, getName: () => c('Lumo emoji name').t`Halo` },
    happy: { src: happyGif, getName: () => c('Lumo emoji name').t`Happy` },
    love: { src: loveGif, getName: () => c('Lumo emoji name').t`Love` },
    'mild-panic': { src: mildPanicGif, getName: () => c('Lumo emoji name').t`Mild panic` },
    'nine-lives': { src: nineLivesGif, getName: () => c('Lumo emoji name').t`Nine lives` },
    party: { src: partyGif, getName: () => c('Lumo emoji name').t`Party` },
    perk: { src: perkGif, getName: () => c('Lumo emoji name').t`Perk` },
    proton: { src: protonGif, getName: () => BRAND_NAME },
    rocket: { src: rocketGif, getName: () => c('Lumo emoji name').t`Rocket` },
    'schrodinger-in-box': {
        src: schrodingerInBoxGif,
        getName: () => c('Lumo emoji name').t`Schrödinger in a box`,
    },
    'schrodinger-out-of-box': {
        src: schrodingerOutOfBoxGif,
        getName: () => c('Lumo emoji name').t`Schrödinger out of the box`,
    },
    search: { src: searchGif, getName: () => c('Lumo emoji name').t`Search` },
    sit: { src: sitGif, getName: () => c('Lumo emoji name').t`Sit` },
    slay: { src: slayGif, getName: () => c('Lumo emoji name').t`Slay` },
    sweep: { src: sweepGif, getName: () => c('Lumo emoji name').t`Sweep` },
    think: { src: thinkGif, getName: () => c('Lumo emoji name').t`Think` },
    'this-is-fine': { src: thisIsFineGif, getName: () => c('Lumo emoji name').t`This is fine` },
    'watch-left': { src: watchLeftGif, getName: () => c('Lumo emoji name').t`Watch left` },
    'watch-right': { src: watchRightGif, getName: () => c('Lumo emoji name').t`Watch right` },
    write: { src: writeGif, getName: () => c('Lumo emoji name').t`Write` },
} satisfies Record<string, LumoEmojiDefinition>;

export type LumoEmojiId = keyof typeof LUMO_EMOJI_DEFINITIONS;

export type LumoEmojiSegment = { type: 'text'; text: string } | { type: 'lumoEmoji'; id: LumoEmojiId };

const LUMO_EMOJI_TOKEN_REGEX = /\[lumo_emoji:([a-z0-9-]+)\]/g;

const isLumoEmojiId = (value: string): value is LumoEmojiId => Object.hasOwn(LUMO_EMOJI_DEFINITIONS, value);

export const LUMO_EMOJI_IDS = Object.keys(LUMO_EMOJI_DEFINITIONS).filter(isLumoEmojiId);

export const getLumoEmojiSrc = (id: LumoEmojiId) => LUMO_EMOJI_DEFINITIONS[id].src;

export const getLumoEmojiName = (id: LumoEmojiId) => LUMO_EMOJI_DEFINITIONS[id].getName();

export const splitTextIntoLumoEmojiSegments = (text: string): LumoEmojiSegment[] => {
    const segments: LumoEmojiSegment[] = [];

    let lastIndex = 0;

    for (const match of text.matchAll(LUMO_EMOJI_TOKEN_REGEX)) {
        const id = match[1];

        if (!isLumoEmojiId(id)) {
            continue;
        }

        if (match.index > lastIndex) {
            segments.push({ type: 'text', text: text.slice(lastIndex, match.index) });
        }

        segments.push({ type: 'lumoEmoji', id });

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        segments.push({ type: 'text', text: text.slice(lastIndex) });
    }

    return segments;
};
