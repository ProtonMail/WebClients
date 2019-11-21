import { useState, useEffect } from 'react';
import { useConversations } from '../hooks/useNewConversations';
import { Element } from '../models/element';
import { useMessages } from '../hooks/useMessages';
import { useLoading } from 'react-components';
import { Message } from '../models/message';

export interface ElementProps {
    elements: Element[];
    loading: boolean;
    page: number;
    setPage: (page: number) => void;
    total: number;
}

interface Props {
    labelID: string;
    children(props: ElementProps): JSX.Element;
}

export const ConversationsContainer = ({ labelID, children }: Props) => {
    const [page, setPage] = useState(0);

    const [conversations, loadingConversations, total] = useConversations({ labelID, pageNumber: page, pageSize: 50 });

    return children({ elements: conversations, loading: loadingConversations, page, setPage, total });
};

export const MessagesContainer = ({ labelID, children }: Props) => {
    const [page, setPage] = useState(0);
    const { getMessages } = useMessages();
    const [loadingMessages, withLoadingMessages] = useLoading(true);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const load = async () => {
            const { Messages } = await getMessages(labelID);
            setMessages(Messages);
        };
        withLoadingMessages(load());
    }, [labelID]);

    return children({ elements: messages, loading: loadingMessages, page, setPage, total: 0 });
};
