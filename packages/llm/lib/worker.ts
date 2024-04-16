import { Engine, EngineWorkerHandler } from '@mlc-ai/web-llm';

// Hookup a chat module to a worker handler
const chat = new Engine();
const handler = new EngineWorkerHandler(chat);
// @ts-ignore
self.onmessage = (msg: MessageEvent) => {
    handler.onmessage(msg);
};
