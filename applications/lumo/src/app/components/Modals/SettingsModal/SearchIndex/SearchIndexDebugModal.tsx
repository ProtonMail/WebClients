import { c } from 'ttag';

import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components/index';

import { SearchIndexDebugPanel } from './SearchIndexDebugPanel';

interface SearchIndexDebugModalProps {
    open: boolean;
    onClose: () => void;
}

export const SearchIndexDebugModal = ({ open, onClose }: SearchIndexDebugModalProps) => {
    return (
        <ModalTwo open={open} onClose={onClose} size="large">
            <ModalTwoHeader title={c('Title').t`Search Index Debug`} />
            <ModalTwoContent className="p-4">
                <SearchIndexDebugPanel enabled={open} />
            </ModalTwoContent>
        </ModalTwo>
    );
};
