import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { useMarkAllAs } from 'proton-mail/hooks/actions/markAs/useMarkAllAs';
import { useMarkSelectionAs } from 'proton-mail/hooks/actions/markAs/useMarkSelectionAs';

import { isMessage as testIsMessage } from '../../../helpers/elements';
import { Element } from '../../../models/element';

export interface MarkAsParams {
    elements: Element[];
    labelID?: string;
    status: MARK_AS_STATUS;
    silent?: boolean;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
}
export const useMarkAs = () => {
    const markSelectionAs = useMarkSelectionAs();
    const { markAllAs, selectAllMarkModal } = useMarkAllAs();

    const markAs = async ({ elements, labelID = '', status, silent = true, selectAll, onCheckAll }: MarkAsParams) => {
        if (!elements.length) {
            return;
        }

        const isMessage = testIsMessage(elements[0]);

        if (selectAll) {
            await markAllAs({ isMessage, labelID, status, onCheckAll });
        } else {
            void markSelectionAs({
                elements,
                labelID,
                status,
                silent,
                isMessage,
            });
        }
    };

    return { markAs, selectAllMarkModal };
};
