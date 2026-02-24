import React from 'react';

import type { SearchItem } from 'applications/lumo/src/app/lib/toolCall/types';
import type { Message } from 'applications/lumo/src/app/types';

// // Debug information object
// const debugInfo = {
//     message: {
//         id: message?.id,
//         role: message?.role,
//         status: message?.status,
//         content: message?.content,
//         createdAt: message?.createdAt,
//         parentId: message?.parentId,
//         conversationId: message?.conversationId,
//         placeholder: message?.placeholder,
//         toolCall: message?.toolCall,
//         toolResult: message?.toolResult,
//         attachments: message?.attachments,
//     },
//     states: {
//         isLoading,
//         isRunning: _isRunning,
//         isGenerating,
//         isFinishedGenerating,
//         generationFailed,
//         doNotShowEmptyMessage,
//         hasToolCall,
//     },
//     content: {
//         messageContent,
//         originalContent: message?.content,
//         contentLength: message?.content?.length || 0,
//     },
//     toolCall: {
//         query,
//         results: results?.length || 0,
//     },
// };

const DebugAssistantMessage = ({
    isLoading,
    isRunning: _isRunning,
    message,
    isGenerating,
    generationFailed,
    isFinishedGenerating,
    hasToolCall,
    messageContent,
    query,
    results,
}: {
    isLoading: boolean;
    isRunning: boolean;
    message: Message;
    isGenerating: boolean;
    generationFailed: boolean;
    isFinishedGenerating: boolean;
    hasToolCall: boolean;
    messageContent: string;
    query: string;
    results: SearchItem[];
}) => {
    return (
        <div className="absolute top-0 left-0" style={{ transform: 'translateX(-100%)' }}>
            <div className="bg-black text-white text-xs p-3 rounded-lg shadow-lg max-w-md ml-2 border border-gray-600">
                <div className="font-bold mb-2 text-yellow-300">Debug Info</div>

                <div className="mb-2">
                    <div className="font-semibold text-blue-300">States:</div>
                    <div className="ml-2 space-y-1">
                        <div>
                            isLoading:{' '}
                            <span className={isLoading ? 'color-success' : 'color-danger'}>{String(isLoading)}</span>
                        </div>
                        <div>
                            isRunning:{' '}
                            <span className={_isRunning ? 'color-success' : 'color-danger'}>{String(_isRunning)}</span>
                        </div>
                        <div>
                            isGenerating:{' '}
                            <span className={isGenerating ? 'color-success' : 'color-danger'}>
                                {String(isGenerating)}
                            </span>
                        </div>
                        <div>
                            generationFailed:{' '}
                            <span className={generationFailed ? 'color-danger' : 'color-success'}>
                                {String(generationFailed)}
                            </span>
                        </div>
                        <div>
                            isFinishedGenerating:{' '}
                            <span className={isFinishedGenerating ? 'color-success' : 'color-danger'}>
                                {String(isFinishedGenerating)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-2">
                    <div className="font-semibold text-blue-300">Message:</div>
                    <div className="ml-2 space-y-1">
                        <div>
                            ID: <span className="text-gray-300">{message?.id || 'N/A'}</span>
                        </div>
                        <div>
                            Status: <span className="text-gray-300">{message?.status || 'undefined'}</span>
                        </div>
                        <div>
                            Role: <span className="text-gray-300">{message?.role || 'N/A'}</span>
                        </div>
                        <div>
                            Placeholder:{' '}
                            <span className={message?.placeholder ? 'color-success' : 'color-danger'}>
                                {String(message?.placeholder || false)}
                            </span>
                        </div>
                        <div>
                            HasToolCall:{' '}
                            <span className={hasToolCall ? 'color-success' : 'color-danger'}>
                                {String(hasToolCall)}
                            </span>
                        </div>
                        <div>
                            hasAttachments:{' '}
                            <span className={!!message?.attachments?.length ? 'color-success' : 'color-danger'}>
                                {String(message?.attachments?.length || 0)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-2">
                    <div className="font-semibold text-blue-300">Content:</div>
                    <div className="ml-2 space-y-1">
                        <div>
                            Length: <span className="text-gray-300">{message?.content?.length || 0}</span>
                        </div>
                        <div>
                            Processed: <span className="text-gray-300">{messageContent?.length || 0}</span>
                        </div>
                        <div>
                            Preview:{' '}
                            <span className="text-gray-300 break-all">
                                {(messageContent || '').substring(0, 50)}
                                {(messageContent?.length || 0) > 50 ? '...' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {query && (
                    <div>
                        <div className="font-semibold text-blue-300">Tool Call:</div>
                        <div className="ml-2 space-y-1">
                            <div>
                                Query: <span className="text-gray-300">{query}</span>
                            </div>
                            <div>
                                Results: <span className="text-gray-300">{results?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebugAssistantMessage;
