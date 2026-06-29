import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import imageGen from '@proton/styles/assets/img/lumo/lumo-whats-new/image-gen.svg';
import lumo2 from '@proton/styles/assets/img/lumo/lumo-whats-new/lumo-2.svg';
import lumoModelMenu from '@proton/styles/assets/img/lumo/lumo-whats-new/lumo-model-menu.svg';
import memory from '@proton/styles/assets/img/lumo/lumo-whats-new/memory.svg';
import lumoWebSearch from '@proton/styles/assets/img/lumo/lumo-whats-new/web-search.svg';
import customLumos from '@proton/styles/assets/img/lumo/lumo-whats-new/custom-lumos.svg';

import type { WhatsNewStage } from './types';

export const getLumo2WhatsNewStages = (): WhatsNewStage[] => [
    {
        id: 'intro',
        image: lumo2,
        imageAlt: `${LUMO_SHORT_APP_NAME} 2.0 mascot`,
        imageScale: 'md',
        getTitle: () => c('collider_2025:Title').t`Introducing ${LUMO_SHORT_APP_NAME} 2.0`,
        getDescription: () =>
            c('collider_2025:Info')
                .t`Advanced models, a new look, new features, and the same privacy you trust. Click through to see what’s new.`,
    },
    {
        id: 'web-search',
        image: lumoWebSearch,
        imageAlt: c('collider_2025: Image alt').t`Web search`,
        imageScale: 'lg',
        getTitle: () => c('collider_2025:Title').t`Better web search`,
        getDescription: () =>
            c('collider_2025:Info').t`Get faster, more accurate answers from the web, with citations so you can check the source.`,
    },
    {
        id: 'image-gen',
        image: imageGen,
        imageAlt: c('collider_2025: Image alt').t`Image generation`,
        imageScale: 'lg',
        getTitle: () => c('collider_2025:Title').t`Image generation and editing`,
        getDescription: () =>
            c('collider_2025:Info')
                .t`Create visuals from a prompt, edit photos, analyze charts, or turn rough sketches into polished graphics.`,
    },
    {
        id: 'models',
        image: lumoModelMenu,
        imageAlt: c('collider_2025: Image alt').t`Model selection menu`,
        imageScale: 'lg',
        getTitle: () => c('collider_2025:Title').t`Two models, two modes`,
        getDescription: () =>
            c('collider_2025:Info')
                .t`Use the Max model for complex work or the Lite model for everyday tasks. Choose Fast mode for quick answers or Thinking mode for tougher questions.`,
    },
    {
        id: 'memory',
        image: memory,
        imageAlt: c('collider_2025: Image alt').t`Memory settings`,
        imageScale: 'lg',
        getTitle: () => c('collider_2025:Title').t`Memory`,
        getDescription: () =>
            c('collider_2025:Info')
                .t`${LUMO_SHORT_APP_NAME} remembers your preferences, so each conversation can build on the last. It can also handle longer chats and larger documents.`,
    },
    {
        id: 'custom-lumos',
        image: customLumos,
        getTitle: () => c('collider_2025:Title').t`Custom ${LUMO_SHORT_APP_NAME}s`,
        getDescription: () =>
            c('collider_2025:Info')
                .t`Create purpose-built assistants with their own instructions. Set them up once, and they’ll follow your preferences every time.`,
    },
];
