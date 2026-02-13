import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import type { CommanderItemInterface } from '@proton/components';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { useCategoriesShortcuts } from 'proton-mail/components/categoryView/useCategoriesShortcuts';
import { useOnCompose } from 'proton-mail/containers/ComposeProvider';

import { useLabelActionsContext } from '../../components/sidebar/EditLabelContext';
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
                icon: 'envelope',
                label: c('Commander action').t`New message`,
                value: 'compose',
                action: () => onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW }),
                shortcuts: ['N'],
            },
            {
                icon: 'tag',
                label: c('Commander action').t`Create a new label`,
                value: 'create-label',
                action: () => createLabel('label'),
            },
            {
                icon: 'folder',
                label: c('Commander action').t`Create a new folder`,
                value: 'create-folder',
                action: () => createLabel('folder'),
            },
            {
                icon: 'envelope-magnifying-glass',
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
                icon: 'file-lines',
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
                icon: 'paper-plane',
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
                icon: 'archive-box',
                label: c('Commander action').t`Go to Archive`,
                value: 'archive',
                action: () => navigateTo(MAILBOX_LABEL_IDS.ARCHIVE),
                shortcuts: ['G', 'A'],
            },
            {
                icon: 'star',
                label: c('Commander action').t`Go to Starred`,
                value: 'starred',
                action: () => navigateTo(MAILBOX_LABEL_IDS.STARRED),
                shortcuts: ['G', '*'],
            },
            {
                icon: 'fire',
                label: c('Commander action').t`Go to Spam`,
                value: 'spam',
                action: () => navigateTo(MAILBOX_LABEL_IDS.SPAM),
                shortcuts: ['G', 'S'],
            },
            {
                icon: 'trash',
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
