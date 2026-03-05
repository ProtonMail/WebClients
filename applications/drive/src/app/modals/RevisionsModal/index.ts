import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { RevisionsModalView } from './RevisionsModalView';
import type { RevisionsModalContentViewProps } from './useRevisionsModalState';
import { type UseRevisionsModalStateProps, useRevisionsModalState } from './useRevisionsModalState';

const RevisionsModal = withHoc<UseRevisionsModalStateProps, RevisionsModalContentViewProps>(
    useRevisionsModalState,
    RevisionsModalView
);

export const useRevisionsModal = () => {
    const [revisionsModal, showRevisionsModal] = useModalTwoStatic(RevisionsModal);
    return { revisionsModal, showRevisionsModal };
};
