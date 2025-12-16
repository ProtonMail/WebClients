# Content Blocks Migration Plan

## Problem
Current Message structure only supports one tool call + one tool result. Cannot intersperse:
`[text] → [tool call] → [tool result] → [text] → [another tool call] → [error]`

## Solution: Content Blocks Array

Add new optional field to `MessagePriv`:

```typescript
export type ContentBlock =
    | { type: 'text'; content: string }
    | { type: 'tool_call'; content: string; id?: string }
    | { type: 'tool_result'; content: string; tool_call_id?: string };

export type MessagePriv = {
    // Legacy (kept forever for backward compat)
    content?: string;
    toolCall?: string;
    toolResult?: string;

    // NEW
    contentBlocks?: ContentBlock[];

    // ... other fields
};
```

## Backward Compatibility

### Reading old messages
```typescript
function getContentBlocks(message: Message): ContentBlock[] {
    if (message.contentBlocks) return message.contentBlocks;

    // Reconstruct from legacy format
    const blocks: ContentBlock[] = [];
    if (message.toolCall) blocks.push({ type: 'tool_call', content: message.toolCall });
    if (message.toolResult) blocks.push({ type: 'tool_result', content: message.toolResult });
    if (message.content) blocks.push({ type: 'text', content: message.content });
    return blocks;
}
```

### Writing new messages
- Always populate `contentBlocks`
- For single tool call case, ALSO populate legacy fields for older clients
- For multiple tool calls, only populate `contentBlocks`

## Migration Phases

1. **Add field** - Add `contentBlocks?` to types, update type guards
2. **Update readers** - UI components use `getContentBlocks()` helper
3. **Update writers** - Message creation populates contentBlocks, Redux actions handle both
4. **Future** - Legacy fields become fallback only

## Example

```typescript
{
    id: 'msg-123',
    contentBlocks: [
        { type: 'text', content: 'Searching...' },
        { type: 'tool_call', content: '{"name":"web_search",...}' },
        { type: 'tool_result', content: '{"results":[...]}' },
        { type: 'text', content: 'Here are the results...' },
        { type: 'tool_call', content: '{"name":"generate_image",...}' },
        { type: 'tool_result', content: '{"error":true}' },
        { type: 'text', content: 'Image generation failed.' }
    ]
}
```

## Key Insight
Never remove old fields. New field is optional. Old messages work automatically via helper function.
