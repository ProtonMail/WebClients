import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import type { MailboxActions } from 'proton-mail/router/interface';

import { MailToolbarHeader } from './MailToolbarHeader';
import { MailToolbarList } from './MailToolbarList';

interface Props {
    placement: 'list' | 'header';
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const MailToolbar = ({ placement, elementsData, actions }: Props) => {
    if (placement === 'list') {
        return <MailToolbarList />;
    }

    return <MailToolbarHeader elementsData={elementsData} actions={actions} />;
};
