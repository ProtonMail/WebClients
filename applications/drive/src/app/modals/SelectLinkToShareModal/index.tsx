import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { SelectLinkToShareModalView, type SelectLinkToShareModalViewProps } from './SelectLinkToShareModalView';
import type { SelectLinkToShareModalInnerProps } from './useSelectLinkToShareModalState';
import {
    type UseSelectLinkToShareModalStateProps,
    useSelectLinkToShareModalState,
} from './useSelectLinkToShareModalState';

const SelectLinkToShareModal = withHoc<UseSelectLinkToShareModalStateProps, SelectLinkToShareModalViewProps>(
    useSelectLinkToShareModalState,
    SelectLinkToShareModalView
);

export const useFileSharingModal = () => {
    const [fileSharingModal, showFileSharingModal] = useModalTwoStatic(SelectLinkToShareModal);
    return [fileSharingModal, showFileSharingModal] as const;
};

export type { SelectLinkToShareModalInnerProps };
