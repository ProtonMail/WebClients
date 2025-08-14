# Lumo API Client (v2.0) 🚀

A **modular, framework-agnostic** LLM API client for Lumo products with clean separation of concerns, fluent request builder API, and dedicated framework integrations.

## 🏗️ **Architecture Overview**

### **Core Modules** (Framework-agnostic)
- **`core/client.ts`** - Main `LumoApiClient` class
- **`core/request-builder.ts`** - Fluent API for building requests  
- **`core/types.ts`** - All type definitions
- **`core/encryption.ts`** - U2L encryption utilities
- **`core/streaming.ts`** - Response stream processing
- **`core/network.ts`** - HTTP request handling

### **Framework Integrations**
- **`integrations/react.ts`** - React hooks (`useLumoChat`, `useQuickChat`)
- **`integrations/redux.ts`** - Redux helpers and thunks

### **Utilities**
- **`utils.ts`** - Helper functions for message processing

---

## 🚀 **Quick Start**

### **Basic Usage (Core)**
```typescript
import { LumoApiClient } from '@proton/lumo-api-client';

const client = new LumoApiClient({
    enableChatEndpoint: true,
    enableU2LEncryption: true
});

await client.callAssistant(api, [
    { role: 'user', content: 'Hello, how are you?' }
], {
    enableExternalTools: true,
    chunkCallback: async (msg) => {
        if (msg.type === 'token_data') {
            console.log(msg.content);
        }
        return {};
    }
});
```

### **Fluent Request Builder API**
```typescript
import { LumoApiClient } from '@proton/lumo-api-client';

const client = new LumoApiClient();

await client.createRequest()
    .user("What's the weather like?")
    .withWebSearch()
    .withTimeout(30000)
    .onChunk(async (msg) => {
        console.log('Chunk:', msg);
        return {};
    })
    .execute((turns, options) => client.callAssistant(api, turns, options));
```

### **React Integration**
```tsx
import { useLumoChat } from '@proton/lumo-api-client/integrations/react';

function ChatComponent() {
    const { messages, sendMessage, isLoading } = useLumoChat(api, {
        enableChatEndpoint: true
    });

    return (
        <div>
            {messages.map(msg => <div key={msg.id}>{msg.content}</div>)}
            <button onClick={() => sendMessage("Hello!")}>
                Send Message
            </button>
        </div>
    );
}
```

### **Redux Integration**
```typescript
import { sendMessageWithRedux } from '@proton/lumo-api-client/integrations/redux';

// In your Redux thunk
export const sendChatMessage = (content: string) => async (dispatch, getState) => {
    await sendMessageWithRedux(api, [
        { role: 'user', content }
    ], {
        dispatch,
        messageId: 'msg-123',
        conversationId: 'conv-456',
        spaceId: 'space-789',
        enableExternalTools: true
    });
};
```

---

## 📋 **Detailed API Reference**

### **LumoApiClient**

#### **Configuration Options**
```typescript
interface LumoApiClientConfig {
    enableU2LEncryption?: boolean;  // Default: true
    enableChatEndpoint?: boolean;   // Default: false
    endpoint?: string;              // Custom endpoint URL
    lumoPubKey?: string;            // PGP public key
    externalTools?: ToolName[];     // ['web_search', 'weather', 'stock', 'cryptocurrency']
    internalTools?: ToolName[];     // ['proton_info']
}
```

#### **Main Methods**
```typescript
// Full-featured assistant call
await client.callAssistant(api, turns, options);

// Quick one-off conversations
const response = await client.quickChat(api, "Hello!", {
    enableWebSearch: true,
    onChunk: (content) => console.log(content)
});

// Create fluent request builder
const builder = client.createRequest();
```

### **RequestBuilder (Fluent API)**

#### **Message Building**
```typescript
builder
    .user("User message")
    .assistant("Assistant response")  
    .system("System prompt")
    .addTurns([...existingTurns])
```

#### **Configuration**
```typescript
builder
    .withWebSearch()                    // Enable external tools
    .withTitle()                        // Request title generation
    .withTimeout(30000)                 // Set timeout
    .withAutoEncryption()               // Auto-generate encryption
    .withoutEncryption()                // Disable encryption
    .withSignal(abortSignal)            // Cancellation support
```

#### **Callbacks**
```typescript
builder
    .onChunk(async (msg) => { ... })   // Stream processing
    .onFinish(async (status) => { ... }) // Completion handling
```

#### **Execution**
```typescript
// Execute with streaming
await builder.execute((turns, options) => 
    client.callAssistant(api, turns, options)
);

// Execute and return response
const response = await builder.quickExecute((turns, options) =>
    client.quickChat(api, turns[0].content!, options)
);
```

---

## 🔧 **Framework Integrations**

### **React Hooks**

#### **`useLumoChat(api, config?)`**
Manages conversation state with streaming updates:
```typescript
const {
    messages,           // Current conversation
    isLoading,          // Request status
    error,              // Error state
    sendMessage,        // Send new message
    clearMessages,      // Clear conversation
    regenerateLastMessage, // Regenerate response
    setMessages         // Direct state control
} = useLumoChat(api);
```

#### **`useQuickChat(api, config?)`**
Simple one-off requests:
```typescript
const { chat, isLoading, error } = useQuickChat(api);

const response = await chat("Hello!", {
    enableWebSearch: true,
    onChunk: (content) => console.log(content)
});
```

#### **`useRequestBuilder(api, config?)`**
Fluent API with React state management:
```typescript
const { execute, quickExecute, isLoading, error, client } = useRequestBuilder(api);

await execute(async (client) => {
    await client.createRequest()
        .user("Hello!")
        .withWebSearch()
        .execute((turns, options) => client.callAssistant(api, turns, options));
});
```

### **Redux Integration**

#### **`sendMessageWithRedux`**
Automatic Redux state updates:
```typescript
await sendMessageWithRedux(api, turns, {
    dispatch,
    messageId: 'msg-123',
    conversationId: 'conv-456', 
    spaceId: 'space-789',
    role: Role.Assistant,
    enableExternalTools: true
});
```

#### **`createReduxCallbacks`**
Generate Redux-integrated callbacks:
```typescript
const { chunkCallback, finishCallback } = createReduxCallbacks(
    dispatch, messageId, conversationId, spaceId, Role.Assistant
);
```

---

## 🌍 **Environment Configuration**

### **Endpoint Selection**
```typescript
// Production
const client = new LumoApiClient({
    enableChatEndpoint: true
});

// Custom endpoint
const client = new LumoApiClient({
    endpoint: 'https://staging-api.proton.me/ai/v1/chat'
});

// Legacy endpoint
const client = new LumoApiClient({
    enableChatEndpoint: false  // Uses direct ML labs endpoint
});
```

### **Encryption Options**
```typescript
// Auto-encryption (recommended)
const client = new LumoApiClient({
    enableU2LEncryption: true
});

// Manual encryption keys
await client.callAssistant(api, turns, {
    requestKey: await generateRequestKey(),
    requestId: generateRequestId(),
    autoGenerateEncryption: false
});

// No encryption
const client = new LumoApiClient({
    enableU2LEncryption: false
});
```

---

## 🛡️ **Error Handling**

```typescript
try {
    await client.callAssistant(api, turns, {
        chunkCallback: async (msg) => {
            if (msg.type === 'error') {
                return { error: new Error('Generation failed') };
            }
            return {};
        },
        finishCallback: async (status) => {
            if (status === 'failed') {
                console.error('Request failed');
            }
        }
    });
} catch (error) {
    if (error.name === 'AbortError') {
        console.log('Request was cancelled');
    } else {
        console.error('Unexpected error:', error);
    }
}
```

---

## 🔗 **Migration Guide**

### **From v1.x to v2.x**

#### **Old way:**
```typescript
import { callLumoAssistant } from '@proton/lumo-api-client';

await callLumoAssistant(api, turns, {
    enableExternalTools: true,
    chunkCallback: ...,
    config: { enableChatEndpoint: true }
});
```

#### **New way (recommended):**
```typescript
import { LumoApiClient } from '@proton/lumo-api-client';

const client = new LumoApiClient({ enableChatEndpoint: true });

await client.createRequest()
    .addTurns(turns)
    .withExternalTools()
    .onChunk(...)
    .execute((turns, options) => client.callAssistant(api, turns, options));
```

#### **New way (backward compatible):**
```typescript
import { callLumoAssistant } from '@proton/lumo-api-client';

await callLumoAssistant(api, turns, {
    enableExternalTools: true,
    chunkCallback: ...,
    config: { enableChatEndpoint: true }
});
```

---


## 🔌 **Request/Response Interceptors**

Interceptors allow you to hook into the request/response lifecycle for debugging, monitoring, authentication, and data transformation.

### **Built-in Interceptors**

```typescript
import { 
    LumoApiClient,
    createLoggingInterceptor,
    createPerformanceInterceptor,
    createContentFilterInterceptor,
    createRateLimitInterceptor
} from './lumo-api-client';

const client = new LumoApiClient();

// Add logging for debugging
client.addRequestInterceptor(createLoggingInterceptor({
    logRequests: true,
    logResponses: true,
    logTiming: true,
    prefix: '[Debug]'
}));

// Add performance monitoring
client.addResponseInterceptor(createPerformanceInterceptor((metrics) => {
    console.log('Request metrics:', metrics);
    // Send to your analytics service
}));

// Add content filtering
client.addResponseInterceptor(createContentFilterInterceptor((content) => {
    return content.replace(/badword/gi, '***');
}));

// Add rate limiting
client.addRequestInterceptor(createRateLimitInterceptor(10)); // 10 requests per minute
```

### **Custom Interceptors**

```typescript
// Custom request interceptor
client.addRequestInterceptor({
    onRequest: async (request, context) => {
        console.log('Sending request:', context.requestId);
        // Modify request if needed
        return request;
    },
    onRequestError: async (error, context) => {
        console.error('Request failed:', error.message);
    }
});

// Custom response interceptor
client.addResponseInterceptor({
    onResponseChunk: async (chunk, context) => {
        if (chunk.type === 'token_data') {
            console.log('Received chunk:', chunk.content.length, 'chars');
        }
        return chunk;
    },
    onResponseComplete: async (status, context) => {
        console.log('Request completed:', status, 'in', Date.now() - context.startTime, 'ms');
    },
    onResponseError: async (error, context) => {
        console.error('Response error:', error.message);
    }
});
```

### **Managing Interceptors**

```typescript
// Clear all interceptors
client.clearInterceptors();

// Clear only request interceptors
client.clearRequestInterceptors();

// Clear only response interceptors
client.clearResponseInterceptors();
```

### **Interceptor Context**

Interceptors receive context objects with useful information:

```typescript
interface RequestContext {
    requestId: string;
    timestamp: number;
    endpoint: string;
    enableU2LEncryption: boolean;
    enableExternalTools: boolean;
    metadata?: Record<string, any>;
}

interface ResponseContext extends RequestContext {
    startTime: number;
    chunkCount: number;
    totalContentLength: number;
}
```

### **Common Use Cases**

```typescript
// 1. Request/Response Logging
const loggingInterceptor = createLoggingInterceptor({
    prefix: '[Production API]',
    logTiming: true
});

// 2. Authentication Headers (for custom endpoints)
const authInterceptor = createCustomHeadersInterceptor({
    'Authorization': 'Bearer ' + token,
    'X-API-Key': apiKey
});

// 3. Content Moderation
const moderationInterceptor = createContentFilterInterceptor((content) => {
    return moderateContent(content); // Your moderation logic
});

// 4. Performance Monitoring
const metricsInterceptor = createPerformanceInterceptor((metrics) => {
    analytics.track('llm_request', metrics);
});

// 5. Request ID Tracking
const trackingInterceptor = createRequestIdInterceptor((requestId) => {
    console.log('Tracking request:', requestId);
    // Store for correlation with logs
});

client.addRequestInterceptor(authInterceptor);
client.addRequestInterceptor(trackingInterceptor);
client.addResponseInterceptor(loggingInterceptor);
client.addResponseInterceptor(moderationInterceptor);
client.addResponseInterceptor(metricsInterceptor);
```

