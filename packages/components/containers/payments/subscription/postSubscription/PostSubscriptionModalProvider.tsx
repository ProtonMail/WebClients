import { type ReactNode, createContext, useContext, useMemo, useState } from 'react';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import PostSubscriptionModal from './PostSubscriptionModal';
import type { PostSubscriptionModalName } from './interface';

interface PostSubscriptionModalContextProps {
    openPostSubscriptionModal: (modalType: PostSubscriptionModalName) => void;
}

const PostSubscriptionModalContext = createContext<PostSubscriptionModalContextProps | undefined>(undefined);

export const usePostSubscriptionModal = () => {
    const context = useContext(PostSubscriptionModalContext);
    if (context === undefined) {
        throw new Error('usePostSubscriptionModal must be used within a PostSubscriptionModalProvider');
    }
    return context;
};

const PostSubscriptionModalProvider = ({ children }: { children: ReactNode }) => {
    const [modalName, setModalName] = useState<PostSubscriptionModalName | null>(null);
    const { openModal, modalProps, render } = useModalStateObject(
        useMemo(() => ({ onExit: () => setModalName(null) }), [])
    );
    const context = useMemo(
        () => ({
            openPostSubscriptionModal: (modalName: PostSubscriptionModalName) => {
                setModalName(modalName);
                openModal(true);
            },
        }),
        []
    );

    return (
        <PostSubscriptionModalContext.Provider value={context}>
            {children}
            {render && <PostSubscriptionModal modalProps={modalProps} name={modalName} />}
        </PostSubscriptionModalContext.Provider>
    );
};

export default PostSubscriptionModalProvider;
