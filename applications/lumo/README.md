# Lumo

## Quick Start


### Enable Performance Monitor

**Keyboard Shortcut (Easiest):**
Press **`Cmd + Shift + P`** (Mac) or **`Ctrl + Shift + P`** (Windows/Linux)

**Or via console:**
```javascript
localStorage.setItem('lumo_debug_perf', 'true')
```

You'll see a performance monitor in the bottom-right corner showing:
- **Tokens/sec**: Streaming speed (~chars÷4 approximation)
- **Redux/sec**: State updates per second
- **Redux updates**: Total updates this session
- **FPS**: Frames per second (Redux update rate)
- **Memory**: JS heap size in MB
- **Messages**: Total messages in Redux
- **Last token**: Time since last token (backend diagnostic)
- **Render time**: Component render time (max shown)
- **Sparkline charts**: Visual history of delays, render times, tokens/sec

### Disable Performance Monitor

Press **`Cmd/Ctrl + Shift + P`** again, or:
```javascript
localStorage.setItem('lumo_debug_perf', 'false')
```


### Progressive Rendering

**Rational**: We want smooth, continuous rendering of streaming markdown with minimal overhead! 

Without this, due to how we're streaming content through, we need to re-render sections all the time. This 
is inefficient.

We can have a large block of markdown, but once a section is complete, e.g. a paragraph or a code block, 
we don't need to render it again. We can split the sections so that they are memoized and don't need to be re-rendered each time, improving performance in terms of memory and reducing computational overhead per update.

```typescript
// 3 blocks being rendered
<MarkdownBlock key="para-abc123" content="Paragraph 1" isStreaming={false} />  // Complete
<MarkdownBlock key="para-def456" content="Paragraph 2" isStreaming={false} />  // Complete  
<MarkdownBlock key="streaming"   content="Paragraph 3|" isStreaming={true} />  // Incomplete
```

#### On Every Token Update

**Token arrives**: `"Paragraph 3 continues|"`

**React reconciliation**:

1. **Block 1** (`key="para-abc123"`):
   ```typescript
   prev.content = "Paragraph 1"
   next.content = "Paragraph 1"
   → contentEqual = true → shouldSkipRender = true → ✅ SKIP
   ```

2. **Block 2** (`key="para-def456"`):
   ```typescript
   prev.content = "Paragraph 2"
   next.content = "Paragraph 2"
   → contentEqual = true → shouldSkipRender = true → ✅ SKIP
   ```

3. **Block 3** (`key="streaming"`):
   ```typescript
   prev.content = "Paragraph 3|"
   next.content = "Paragraph 3 continues|"
   → contentEqual = FALSE → shouldSkipRender = false → ✅ RE-RENDER!
   ```

**Result**: Only the incomplete block re-renders and re-parses through Markdown!

#### The Markdown Component

```tsx
<Markdown
    remarkPlugins={plugins}
    components={{ code: CodeBlock }}
>
    {content}  {/* Content changes → Markdown re-parses → Updates display */}
</Markdown>
```

#### What Happens During Re-render

1. **Markdown parser** runs on new content
2. **Syntax highlighting** applied to code blocks
3. **DOM updates** with new formatted content
4. **Browser renders** the changes

#### Example Flow

**Frame 1**: `"```python\ndef hello"`
- Markdown sees incomplete code block
- Renders as: ` ```python\ndef hello ` (raw, no closing backticks)

**Frame 2**: `"```python\ndef hello()\n```"`
- Markdown sees complete code block
- Renders with syntax highlighting: `def hello()` (colorful!)

**Frame 3**: `"```python\ndef hello():\n    return 'world'\n```"`
- Markdown re-parses
- Updates syntax highlighting: full function highlighted




