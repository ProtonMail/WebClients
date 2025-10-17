import { useCallback, useEffect, useReducer, useRef } from 'react';

import type { MessageAction, MessageState, PiPOverlayMessage, PiPOverlayMessageType } from './types';

const MESSAGE_EXPIRATION_TIME = 3000;

// Message reducer
const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
    switch (action.type) {
        case 'ADD_MESSAGE': {
            const newMessages = [...state.messages, action.payload];
            return {
                ...state,
                messages: newMessages.slice(-state.maxMessages), // Keep only last N messages
            };
        }
        case 'CLEAR_MESSAGES':
            return {
                ...state,
                messages: [],
            };
        case 'REMOVE_MESSAGE': {
            return {
                ...state,
                messages: state.messages.filter((msg) => msg.id !== action.payload),
            };
        }
        default:
            return state;
    }
};

const initialState: MessageState = {
    messages: [],
    maxMessages: 5,
};

export function usePiPMessages() {
    const [state, dispatch] = useReducer(messageReducer, initialState);

    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    // Add system message
    const addSystemMessage = useCallback((message: string, type: 'info' | 'error' = 'info') => {
        const messageType: PiPOverlayMessageType = type === 'info' ? 'systemInfoMessage' : 'systemErrorMessage';

        const newMessage: PiPOverlayMessage = {
            id: Date.now().toString(),
            message,
            type: messageType,
            timestamp: Date.now(),
        };

        const timeoutId = setTimeout(() => {
            dispatch({ type: 'REMOVE_MESSAGE', payload: newMessage.id });

            timeoutsRef.current = timeoutsRef.current.filter((timeoutId) => timeoutId !== timeoutId);
        }, MESSAGE_EXPIRATION_TIME);
        timeoutsRef.current.push(timeoutId);

        dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
    }, []);

    // Add chat message
    const addChatMessage = useCallback((sender: string, message: string) => {
        const newMessage: PiPOverlayMessage = {
            id: Date.now().toString(),
            message,
            type: 'chatMessage',
            timestamp: Date.now(),
            sender,
        };

        const timeoutId = setTimeout(() => {
            dispatch({ type: 'REMOVE_MESSAGE', payload: newMessage.id });

            timeoutsRef.current = timeoutsRef.current.filter((timeoutId) => timeoutId !== timeoutId);
        }, MESSAGE_EXPIRATION_TIME);
        timeoutsRef.current.push(timeoutId);

        dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
    }, []);

    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
            timeoutsRef.current = [];
        };
    }, []);

    return {
        messages: state.messages,
        addSystemMessage,
        addChatMessage,
    };
}
