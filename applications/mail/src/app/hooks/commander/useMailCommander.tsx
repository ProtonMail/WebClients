import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import type { CommanderItemInterface } from '@proton/components/components/commander/Commander';
import { IcArchiveBox } from '@proton/icons/icons/IcArchiveBox';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcEnvelopeMagnifyingGlass } from '@proton/icons/icons/IcEnvelopeMagnifyingGlass';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcFire } from '@proton/icons/icons/IcFire';
import { IcFolder } from '@proton/icons/icons/IcFolder';
import { IcPaperPlane } from '@proton/icons/icons/IcPaperPlane';
import { IcStar } from '@proton/icons/icons/IcStar';
import { IcTag } from '@proton/icons/icons/IcTag';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { useCategoriesShortcuts } from '../../components/categoryView/useCategoriesShortcuts';
import { useLabelActionsContext } from '../../components/sidebar/EditLabelContext';
import { useOnCompose } from '../../containers/ComposeProvider';
import { ComposeTypes } from '../composer/useCompose';

export const useMailCommander = () => {
    const history = useHistory();

    const onCompose = useOnCompose();
    const [mailSettings] = useMailSettings();
    const { createLabel } = useLabelActionsContext();

    const { moveToCategoriesOption } = useCategoriesShortcuts();

    const navigateTo = (labelID: MAILBOX_LABEL_IDS) => {
        history.push(`/${LABEL_IDS_TO_HUMAN[labelID]}`);
    };

    const commanderList = useMemo<CommanderItemInterface[]>(
        () => [
            {
                icon: IcEnvelope,
                label: c('Commander action').t`New message`,
                value: 'compose',
                action: () => onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW }),
                shortcuts: ['N'],
            },
            {
                icon: IcTag,
                label: c('Commander action').t`Create a new label`,
                value: 'create-label',
                action: () => createLabel('label'),
            },
            {
                icon: IcFolder,
                label: c('Commander action').t`Create a new folder`,
                value: 'create-folder',
                action: () => createLabel('folder'),
            },
            {
                icon: IcEnvelopeMagnifyingGlass,
                label: c('Commander action').t`Search`,
                value: 'search',
                action: () => {
                    const button = document.querySelector('[data-shorcut-target="searchbox-button"]') as HTMLElement;
                    button?.dispatchEvent(
                        new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: false,
                        })
                    );
                },
                shortcuts: ['/'],
            },
            ...moveToCategoriesOption,
            {
                icon: IcFileLines,
                label: c('Commander action').t`Go to Drafts`,
                value: 'drafts',
                action: () =>
                    navigateTo(
                        hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS)
                            ? MAILBOX_LABEL_IDS.ALL_DRAFTS
                            : MAILBOX_LABEL_IDS.DRAFTS
                    ),
                shortcuts: ['G', 'D'],
            },
            {
                icon: IcPaperPlane,
                label: c('Commander action').t`Go to Sent`,
                value: 'sent',
                action: () =>
                    navigateTo(
                        hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT)
                            ? MAILBOX_LABEL_IDS.ALL_SENT
                            : MAILBOX_LABEL_IDS.SENT
                    ),
                shortcuts: ['G', 'E'],
            },
            {
                icon: IcArchiveBox,
                label: c('Commander action').t`Go to Archive`,
                value: 'archive',
                action: () => navigateTo(MAILBOX_LABEL_IDS.ARCHIVE),
                shortcuts: ['G', 'A'],
            },
            {
                icon: IcStar,
                label: c('Commander action').t`Go to Starred`,
                value: 'starred',
                action: () => navigateTo(MAILBOX_LABEL_IDS.STARRED),
                shortcuts: ['G', '*'],
            },
            {
                icon: IcFire,
                label: c('Commander action').t`Go to Spam`,
                value: 'spam',
                action: () => navigateTo(MAILBOX_LABEL_IDS.SPAM),
                shortcuts: ['G', 'S'],
            },
            {
                icon: IcTrash,
                label: c('Commander action').t`Go to Trash`,
                value: 'trash',
                action: () => navigateTo(MAILBOX_LABEL_IDS.TRASH),
                shortcuts: ['G', 'T'],
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-474AD0
        []
    );

    return {
        commanderList,
    };
};
