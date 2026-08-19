import type { ElementsStructure } from '../../hooks/mailbox/useElements';
import type { MailboxActions } from '../../router/interface';

import { MailToolbarHeader } from './MailToolbarHeader';
import { MailToolbarList } from './MailToolbarList';

interface Props {
    placement: 'list' | 'header';
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const MailToolbar = ({ placement, elementsData, actions }: Props) => {
    if (placement === 'list') {
        return <MailToolbarList elementsData={elementsData} actions={actions} />;
    }

    return <MailToolbarHeader elementsData={elementsData} actions={actions} />;
};
