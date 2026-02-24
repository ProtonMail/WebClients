import { useModalTwoStatic } from '@proton/components/index';

import { withHoc } from '../../hooks/withHoc';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { CopyItemsModalView, type CopyItemsModalViewProps } from './CopyItemsModalView';
import type { CopyModalItem } from './useCopyItemsModalState';
import { type UseCopyItemsModalStateProps, useCopyItemsModalState } from './useCopyItemsModalState';

const CopyItemsModal = withHoc<UseCopyItemsModalStateProps, CopyItemsModalViewProps>(
    useCopyItemsModalState,
    CopyItemsModalView
);

export const useCopyItemsModal = () => {
    const [copyModal, showModal] = useModalTwoStatic(CopyItemsModal);
    function showCopyItemsModal(itemsToCopy: CopyModalItem[]) {
        if (!itemsToCopy.length) {
            handleSdkError(new Error('CopyItemsModal called with no items selected'));
            return;
        }
        showModal({ itemsToCopy });
    }

    return { copyModal, showCopyItemsModal };
};
