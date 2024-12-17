import { useCallback } from 'react';

import type { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import type { SOURCE_ACTION } from 'proton-mail/components/list/useListTelemetry';
import { useMarkAllAs } from 'proton-mail/hooks/actions/markAs/useMarkAllAs';
import { useMarkSelectionAs } from 'proton-mail/hooks/actions/markAs/useMarkSelectionAs';

import { isMessage as testIsMessage } from '../../../helpers/elements';
import type { Element } from '../../../models/element';

export interface MarkAsParams {
    elements: Element[];
    labelID?: string;
    status: MARK_AS_STATUS;
    silent?: boolean;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
    sourceAction: SOURCE_ACTION;
    currentFolder: string;
}
export const useMarkAs = () => {
    const markSelectionAs = useMarkSelectionAs();
    const { markAllAs, selectAllMarkModal } = useMarkAllAs();

    const markAs = useCallback(
        async ({
            elements,
            labelID = '',
            status,
            silent = true,
            selectAll,
            onCheckAll,
            sourceAction,
            currentFolder,
        }: MarkAsParams) => {
            if (!elements.length) {
                return;
            }

            const isMessage = testIsMessage(elements[0]);

            if (selectAll) {
                await markAllAs({ isMessage, labelID, status, onCheckAll, sourceAction, currentFolder });
            } else {
                void markSelectionAs({
                    elements,
                    labelID,
                    status,
                    silent,
                    isMessage,
                    sourceAction,
                    currentFolder,
                });
            }
        },
        [markAllAs, markSelectionAs]
    );

    return { markAs, selectAllMarkModal };
};
