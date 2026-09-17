import { c } from 'ttag';

import { IcBroom } from '@proton/icons/icons/IcBroom';
import { IcClockPaperPlane } from '@proton/icons/icons/IcClockPaperPlane';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcLightbulb } from '@proton/icons/icons/IcLightbulb';
import type { WelcomeSuggestionCard } from '@proton/lumo-ui/WelcomeSuggestions';

export const WELCOME_SUGGESTIONS: WelcomeSuggestionCard[] = [
    {
        id: 'auto-reply',
        icon: IcClockPaperPlane,
        getTitle: () => c('Info').t`Set my out of office`,
        getDescription: () =>
            c('Info')
                .t`Tell me when you're away and what you'd like it to say, and you'll see the whole thing before it saves.`,
        getPrompt: () =>
            c('Info')
                .t`Hey Lumo, I'm going away and want an out-of-office reply set up. Ask me for the dates and what it should say, then show me the message before you turn it on.`,
    },
    {
        id: 'triage',
        icon: IcInbox,
        getTitle: () => c('Info').t`What needs handling?`,
        getDescription: () =>
            c('Info')
                .t`I'll go through last week's mail and pull out what actually needs a reply, so you can deal with it in one go.`,
        getPrompt: () =>
            c('Info')
                .t`Hey Lumo, search for my emails from the last 7 days and tell me which ones actually need a reply from me. Give me a line on what each one is asking for, and leave out anything I can ignore.`,
    },
    {
        id: 'organise',
        icon: IcBroom,
        getTitle: () => c('Info').t`Tidy up my inbox`,
        getDescription: () =>
            c('Info')
                .t`I'll look at what you get most of and the folders and filters you already have, then suggest what to improve and what's missing. Nothing moves until you say so.`,
        getPrompt: () =>
            c('Info')
                .t`Hey Lumo, have a look at what I get most of in my inbox, and at the folders and filters I already have, then suggest how to keep it organised: what to change about the ones I've got, and anything new worth adding. Talk me through the plan first, and don't move anything until I say yes.`,
    },
    {
        id: 'capabilities',
        icon: IcLightbulb,
        getTitle: () => c('Info').t`What can you do?`,
        getDescription: () =>
            c('Info')
                .t`A quick walk through what I can help with in your mailbox, from finding old mail to drafting replies, and what I can't do.`,
        getPrompt: () =>
            c('Info')
                .t`Hey Lumo, walk me through how you can help me with my mailbox. What kinds of things can I ask you to do, and what can't you help with?`,
    },
];
