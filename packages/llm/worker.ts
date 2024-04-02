import { ChatModule, ChatWorkerHandler } from '@mlc-ai/web-llm';

// Hookup a chat module to a worker handler
const chat = new ChatModule();
const handler = new ChatWorkerHandler(chat);
// @ts-ignore
self.onmessage = (msg: MessageEvent) => {
    handler.onmessage(msg);
};
