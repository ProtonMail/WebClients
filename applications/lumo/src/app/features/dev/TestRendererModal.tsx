/**
 * Test Renderer Modal
 *
 * This debug tool allows developers to inject various types of content into conversations
 * to test the rendering pipeline, including:
 * - HTML content that triggers turndown conversion
 * - LaTeX equations (inline and block)
 * - Code blocks in various languages
 * - Complex markdown
 * - Edge cases (empty content, special characters, etc.)
 * - Artifact panel viz format boundary (document chat-fences vs presentation chart placeholders)
 * - Standalone artifact types for UI: code, webpage (HTML/JS preview), document (WYSIWYG email)
 *
 * Usage:
 * 1. Open the Performance Monitor (Cmd/Ctrl + Shift + P)
 * 2. Click "Test Renderer" button
 * 3. Select test cases to inject
 * 4. Click "Inject Test Content"
 *
 * This helps identify rendering issues, performance problems, and crashes
 * before they reach production.
 */
import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';

import {
    DOCUMENT_WITH_CHAT_VIZ_BLOCKS,
    PRESENTATION_WITH_CHART_PLACEHOLDER,
    PRESENTATION_WITH_VEGA_LITE_FENCE,
} from '../../components/Conversation/artifact/artifactVisualizationFixtures';
import { CREATE_ARTIFACT_TOOL_NAME } from '../../components/Conversation/artifact/createArtifactTool';
import { generateSpaceKeyBase64 } from '../../crypto';
import { useLumoDispatch } from '../../redux/hooks';
import { addConversation } from '../../redux/slices/core/conversations';
import { addMessage } from '../../redux/slices/core/messages';
import { addSpace, newSpaceId } from '../../redux/slices/core/spaces';
import { type ContentBlock, type Conversation, ConversationStatus, type Message, Role, type Space } from '../../types';

interface TestRendererModalProps {
    open: boolean;
    onClose: () => void;
}

interface TestContentSample {
    name: string;
    content: string;
    blocks?: ContentBlock[];
}

function makeArtifactToolCallBlock(
    args: { id: string; type: string; title: string; content: string; language?: string },
    callId: string
): ContentBlock {
    return {
        type: 'tool_call',
        content: JSON.stringify({ id: callId, name: CREATE_ARTIFACT_TOOL_NAME, arguments: args }),
        toolCall: { id: callId, name: CREATE_ARTIFACT_TOOL_NAME, arguments: args },
    };
}

// Test content samples that cover various edge cases
const TEST_CONTENT_SAMPLES: Record<string, TestContentSample> = {
    html_divs: {
        name: 'HTML with DIVs (Turndown)',
        content: `<div>This is a test with HTML divs that should trigger turndown conversion.</div><div>Second paragraph in a div.</div><p>And a paragraph tag.</p>`,
    },
    html_complex: {
        name: 'Complex HTML',
        content: `<div><h1>Heading</h1><p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item 1</li><li>Item 2</li></ul></div>`,
    },
    latex_inline: {
        name: 'Inline LaTeX ($)',
        content: `Here's an equation: $E = mc^2$ and another: $\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$`,
    },
    latex_block: {
        name: 'Block LaTeX',
        content: `Here's a block equation:\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\nAnd another:\n\n$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$`,
    },
    code_inline: {
        name: 'Inline Code',
        content: `Use the \`console.log()\` function to debug. Also try \`Array.map()\` and \`Promise.all()\`.`,
    },
    latex_single_dollar_math: {
        name: 'Single Dollar Math',
        content: `**Total Cash Invested:** $500 × 60 months = **$30,000**.`,
    },
    code_block_js: {
        name: 'JavaScript Code Block',
        content: `Here's some JavaScript:\n\n\`\`\`javascript\nfunction fibonacci(n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10));\n\`\`\``,
    },
    code_block_python: {
        name: 'Python Code Block',
        content: `Here's some Python:\n\n\`\`\`python\ndef quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)\n\nprint(quicksort([3,6,8,10,1,2,1]))\n\`\`\``,
    },
    markdown_complex: {
        name: 'Complex Markdown',
        content: `# Heading 1\n\n## Heading 2\n\n### Heading 3\n\n**Bold text** and *italic text* and ***bold italic***.\n\n- Bullet point 1\n- Bullet point 2\n  - Nested bullet\n  - Another nested\n\n1. Numbered item 1\n2. Numbered item 2\n\n> This is a blockquote\n> with multiple lines\n\n[Link to Proton](https://proton.me)\n\n---\n\nHorizontal rule above.`,
    },
    tables: {
        name: 'Markdown Tables',
        content: `Here's a table:\n\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Data A   | Data B   |\n| Row 2    | Data C   | Data D   |\n| Row 3    | Data E   | Data F   |`,
    },
    mixed_content: {
        name: 'Mixed Content (Kitchen Sink)',
        content: `# Test Document\n\nThis tests **multiple** content types:\n\n## Math\n\n$$x^2 + y^2 = z^2$$\n\n$$\\frac{d}{dx}(x^n) = nx^{n-1}$$\n\n## Code\n\nInline: \`const x = 42;\`\n\nBlock:\n\`\`\`typescript\ninterface User {\n    id: string;\n    name: string;\n    email: string;\n}\n\nconst user: User = {\n    id: '123',\n    name: 'John',\n    email: 'john@example.com'\n};\n\`\`\`\n\n## Lists\n\n- Item 1\n- Item 2\n  - Nested\n\n1. First\n2. Second\n\n## Quote\n\n> This is a quote\n> with multiple lines\n\n## Table\n\n| Name | Age | City |\n|------|-----|------|\n| Alice | 30 | NYC |\n| Bob | 25 | LA |`,
    },
    special_chars: {
        name: 'Special Characters',
        content: `Testing special chars: © ® ™ € £ ¥ § ¶ † ‡ • … ← → ↑ ↓ ≈ ≠ ≤ ≥ ∞ ∑ ∏ √ ∫ α β γ δ ε`,
    },
    long_text: {
        name: 'Long Text (Performance)',
        content:
            `Lorem ipsum dolor sit amet, consectetur adipiscing elit. `.repeat(100) +
            `\n\n` +
            `Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. `.repeat(50),
    },
    empty_content: {
        name: 'Empty Content',
        content: '',
    },
    whitespace: {
        name: 'Whitespace Only',
        content: '   \n\n   \n   ',
    },
    link_with_annotation: {
        name: 'Link with Annotation',
        content: 'This is a link with Annotation: https://www.morgen.so/morgen-for-linux[3](#ref-3)',
    },
    image_basic: {
        name: 'Image (Basic Markdown)',
        content: `Here's a basic markdown image that should NOT render inline, but be accessible via a link:\n\n![Proton logo](https://proton.me/images/proton-logo.png)\n\nText after the image.`,
    },
    image_no_alt: {
        name: 'Image without Alt Text',
        content: `Image with no alt text (should fall back to "[image]"):\n\n![](https://example.com/image.jpg)\n\nText after.`,
    },
    image_with_long_alt: {
        name: 'Image with Long Alt Text',
        content: `Image with a long, descriptive alt text:\n\n![A detailed description of a beautiful sunset over the ocean with vibrant colors](https://example.com/sunset.jpg)`,
    },
    image_multiple: {
        name: 'Multiple Images',
        content: `Multiple images in a row:\n\n![First image](https://example.com/1.png)\n\n![Second image](https://example.com/2.png)\n\n![Third image](https://example.com/3.png)`,
    },
    image_inline_in_paragraph: {
        name: 'Image Inline in Paragraph',
        content: `An image ![inline](https://example.com/inline.png) sits inside this paragraph along with some other text.`,
    },
    image_with_data_url: {
        name: 'Image with Data URL',
        content: `Image using a data URL (should also be rendered as a link, not inline):\n\n![tiny pixel](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=)`,
    },
    image_attachment: {
        name: 'Image (Attachment URL)',
        content: `Attachment-style image which should render via the inline attachment component:\n\n![attached file](attachment:test-attachment-id-123)\n\nNote: this will only display correctly if the attachment exists in Redux.`,
    },
    image_with_special_chars_in_alt: {
        name: 'Image with Special Chars in Alt',
        content: `Alt text with markdown-like special characters:\n\n![Some **bold** & <script>tag</script> in alt](https://example.com/x.png)`,
    },
    image_mixed_with_markdown: {
        name: 'Image Mixed with Markdown',
        content: `# Article with Images\n\nSome **introductory** text before the image.\n\n![Header image](https://example.com/header.jpg)\n\n## Section\n\n- List item with ![icon](https://example.com/icon.png) inline\n- Another item\n\n> Blockquote with an image: ![quote](https://example.com/quote.png)\n\nFinal paragraph.`,
    },
    // --- Artifacts (Test Renderer list order: chat viz reference → document → code → webpage → slides → multi) ---
    chat_viz_fences_reference: {
        name: 'Chat viz (reference): card-row + vega-lite in message body',
        content: `Same markdown as the document artifact viz fixture, rendered **in chat** (not the side panel):

${DOCUMENT_WITH_CHAT_VIZ_BLOCKS}`,
    },
    artifact_viz_document_chat_fences: {
        name: 'Artifact panel: document with chat viz fences (cards → table/quote, live chart)',
        content: `Open the **document** artifact in the side panel. The \`card-row\` should show as a Metric / Value / Change table, the \`card\` as a quote, and the \`vega-lite\` fence as a live chart — no raw JSON.`,
        blocks: [
            makeArtifactToolCallBlock(
                {
                    id: 'viz-format-document',
                    type: 'document',
                    title: 'Document · card-row→table, card→quote, vega-lite→live chart',
                    content: DOCUMENT_WITH_CHAT_VIZ_BLOCKS,
                },
                'call-artifact-viz-document'
            ),
        ],
    },
    artifact_ui_document_email: {
        name: 'Artifact panel: document (invitation email / WYSIWYG)',
        content: `Open the **document** artifact and switch to rich-text edit to exercise the WYSIWYG editor. Content is a casual invitation email with bold text and a numbered list.`,
        blocks: [
            makeArtifactToolCallBlock(
                {
                    id: 'artifact-ui-birthday-party-email',
                    type: 'document',
                    title: 'Document · invitation email (bold, numbered list; WYSIWYG edit)',
                    content: `**Subject:** 🎂 Birthday Party at My Place this Saturday!

**Hey everyone!**

Hope you're all having a great week! I wanted to invite you to a birthday party at my place this Saturday, starting at 7 PM.

What's the plan? Cake, snacks, good drinks, and good company. I'll handle the cake and main treats (trust me, there's plenty to go around), and I'd love for everyone to bring whatever drinks they'd like to enjoy. Whether you're into beer, wine, cocktails, or something non-alcoholic — feel free to bring what you fancy.

**When:** Saturday at 7 PM **Where:** My place (I'll send the address if you don't already have it!)

Please reply to let me know:

1. How many people you'll be bringing (just so I can plan enough cake and seating)
2. What drinks you'll be bringing (or if you'd like me to handle everything)
3. oh my gosh

Looking forward to celebrating with you all! Let me know if you have any dietary restrictions too.

Cheers,
[Your Name]

---

**P. S.** If you have a favorite party snack or dessert you'd like to share, feel free to bring it along too!`,
                },
                'call-artifact-ui-document-email'
            ),
        ],
    },
    artifact_ui_code: {
        name: 'Artifact panel: code (TypeScript)',
        content: `Open the **code** artifact to check syntax highlighting, line numbers, and panel chrome.`,
        blocks: [
            makeArtifactToolCallBlock(
                {
                    id: 'artifact-ui-ts-helper',
                    type: 'code',
                    language: 'typescript',
                    title: 'Code · TypeScript RSVP helper (syntax highlight, line numbers)',
                    content: `type Rsvp = { name: string; guests: number; bringingDrinks: boolean };

export function countGuests(rsvps: Rsvp[]): number {
    return rsvps.reduce((total, rsvp) => {
        return total + 1 + rsvp.guests;
    }, 0);
}

const sample: Rsvp[] = [
    { name: 'Alex', guests: 1, bringingDrinks: true },
    { name: 'Sam', guests: 0, bringingDrinks: false },
];

console.log(\`Expected headcount: \${countGuests(sample)}\`);`,
                },
                'call-artifact-ui-code'
            ),
        ],
    },
    artifact_ui_webpage: {
        name: 'Artifact panel: webpage (HTML + JS)',
        content: `Open the **webpage** artifact. Use preview vs source toggle; the page should show a styled counter button.`,
        blocks: [
            makeArtifactToolCallBlock(
                {
                    id: 'artifact-ui-webpage-counter',
                    type: 'webpage',
                    title: 'Webpage · sandbox preview: gradient card + “+1 guest” button',
                    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Birthday RSVP demo</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, sans-serif;
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
      color: #f4f4f5;
    }
    .card {
      background: #fff;
      color: #18181b;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      text-align: center;
      max-width: 320px;
    }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    p { margin: 0 0 1.25rem; color: #52525b; font-size: 0.9rem; }
    #count { font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
    button {
      background: #6d4aff;
      color: #fff;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
    }
    button:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Birthday party RSVPs</h1>
    <p>Click to simulate another guest replying.</p>
    <div id="count">0</div>
    <button type="button" id="btn">+1 guest</button>
  </div>
  <script>
    (function () {
      var n = 0;
      var el = document.getElementById('count');
      document.getElementById('btn').addEventListener('click', function () {
        n += 1;
        el.textContent = String(n);
      });
    })();
  </script>
</body>
</html>`,
                },
                'call-artifact-ui-webpage'
            ),
        ],
    },
    artifact_viz_presentation_wrong_vega_fence: {
        name: 'Artifact panel: slides with stray vega-lite fence (cleaned up to a chart)',
        content: `Open the **presentation** artifact. The chat-style \`vega-lite\` fence inside the slide HTML is rewritten to a chart placeholder, so the slide should show a bar chart, not raw Vega JSON.`,
        blocks: [
            makeArtifactToolCallBlock(
                {
                    id: 'viz-format-slides-wrong',
                    type: 'presentation',
                    title: 'Slides · chat vega-lite fence rewritten to bar chart in slide',
                    content: PRESENTATION_WITH_VEGA_LITE_FENCE,
                },
                'call-artifact-viz-slides-wrong'
            ),
        ],
    },
    artifact_viz_presentation_chart_placeholder: {
        name: 'Artifact panel: slides with chart placeholder (working embed)',
        content: `Open the **presentation** artifact. The slide should show a pre-rendered bar chart (SVG), using \`application/lumo-vega-lite+json\`.`,
        blocks: [
            makeArtifactToolCallBlock(
                {
                    id: 'viz-format-slides-ok',
                    type: 'presentation',
                    title: 'Slides · lumo-vega-lite placeholder renders SVG bar chart',
                    content: PRESENTATION_WITH_CHART_PLACEHOLDER,
                },
                'call-artifact-viz-slides-ok'
            ),
        ],
    },
    artifact_debug_test: {
        name: 'Artifact Debug Test (Multi)',
        content: `Here are multiple artifacts to test the rendering:

Some text between artifacts.

This test should show two artifacts: one document and one code block.`,
        blocks: [
            makeArtifactToolCallBlock(
                {
                    id: 'sample-document',
                    type: 'document',
                    title: 'Document · markdown headings, bullets, inline code',
                    content: `# Sample Document

This is a **markdown** document with some content.

- Item 1
- Item 2
- Item 3

## Code Example

Here's some inline code: \`console.log("test")\``,
                },
                'call-artifact-doc'
            ),
            makeArtifactToolCallBlock(
                {
                    id: 'python-script',
                    type: 'code',
                    language: 'python',
                    title: 'Code · Python factorial (syntax highlight, line numbers)',
                    content: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# Test the function
result = factorial(5)
print(f"5! = {result}")`,
                },
                'call-artifact-code'
            ),
        ],
    },
};

interface RouteParams {
    conversationId?: string;
}

export const TestRendererModal = ({ open, onClose }: TestRendererModalProps) => {
    const dispatch = useLumoDispatch();
    const history = useHistory();
    const { conversationId: currentConversationId } = useParams<RouteParams>();
    const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

    const handleToggleTest = (testKey: string) => {
        const newSelected = new Set(selectedTests);
        if (newSelected.has(testKey)) {
            newSelected.delete(testKey);
        } else {
            newSelected.add(testKey);
        }
        setSelectedTests(newSelected);
    };

    const handleSelectAll = () => {
        setSelectedTests(new Set(Object.keys(TEST_CONTENT_SAMPLES)));
    };

    const handleDeselectAll = () => {
        setSelectedTests(new Set());
    };

    const handleInjectContent = () => {
        if (selectedTests.size === 0) {
            alert('Please select at least one test case');
            return;
        }

        const now = new Date();
        let targetConversationId: string;
        let shouldNavigate = false;

        // If we're in a conversation, inject into it. Otherwise, create a new one.
        if (currentConversationId) {
            targetConversationId = currentConversationId;
        } else {
            // Create a new test conversation
            const testSpaceId = newSpaceId();
            const spaceKey = generateSpaceKeyBase64();

            // Create a test space
            const testSpace: Space = {
                id: testSpaceId,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                spaceKey,
                isProject: false,
            };

            dispatch(addSpace(testSpace));

            // Create a test conversation
            const testConversation: Conversation = {
                id: newSpaceId(),
                spaceId: testSpaceId,
                title: 'Renderer Test Conversation',
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                starred: false,
                status: ConversationStatus.COMPLETED,
            };

            dispatch(addConversation(testConversation));
            targetConversationId = testConversation.id;
            shouldNavigate = true;
        }

        // Inject test messages with proper parent-child relationships
        let previousMessageId: string | undefined;

        Array.from(selectedTests).forEach((testKey, index) => {
            const sample = TEST_CONTENT_SAMPLES[testKey as keyof typeof TEST_CONTENT_SAMPLES];

            // Add user message (question)
            const userMessageId = `test-user-${testKey}-${Date.now()}-${index}`;
            const userMessage: Message = {
                id: userMessageId,
                conversationId: targetConversationId,
                role: Role.User,
                content: `Test case: ${sample.name}`,
                createdAt: new Date(now.getTime() + index * 2000).toISOString(),
                ...(previousMessageId && { parentId: previousMessageId }),
            };

            // Add assistant message (test content)
            const assistantMessageId = `test-assistant-${testKey}-${Date.now()}-${index}`;
            const assistantMessage: Message = {
                id: assistantMessageId,
                conversationId: targetConversationId,
                role: Role.Assistant,
                content: sample.content,
                createdAt: new Date(now.getTime() + index * 2000 + 1000).toISOString(),
                parentId: userMessageId,
                status: 'succeeded',
                ...(sample.blocks && { blocks: sample.blocks }),
            };

            dispatch(addMessage(userMessage));
            dispatch(addMessage(assistantMessage));

            // Set the assistant message as the parent for the next user message
            previousMessageId = assistantMessageId;
        });

        // Navigate to the conversation if we created a new one
        if (shouldNavigate) {
            history.push(`/c/${targetConversationId}`);
        }

        alert(
            `Injected ${selectedTests.size} test cases into ${shouldNavigate ? 'a new' : 'the current'} conversation!`
        );
        onClose();
    };

    return (
        <ModalTwo open={open} onClose={onClose} size="large">
            <ModalTwoHeader title={c('lumo: Test Renderer').t`Test Renderer`} />
            <ModalTwoContent>
                <div style={{ padding: '1rem' }}>
                    <p style={{ marginBottom: '1rem' }}>
                        {currentConversationId
                            ? c('lumo: Test Renderer')
                                  .t`Select test cases to inject into the current conversation. This will help test various rendering scenarios including HTML conversion, LaTeX, code blocks, and edge cases.`
                            : c('lumo: Test Renderer')
                                  .t`Select test cases to inject. A new test conversation will be created with the selected test cases to help test various rendering scenarios including HTML conversion, LaTeX, code blocks, and edge cases.`}
                    </p>

                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <Button size="small" onClick={handleSelectAll}>
                            {c('lumo: Test Renderer').t`Select All`}
                        </Button>
                        <Button size="small" onClick={handleDeselectAll}>
                            {c('lumo: Test Renderer').t`Deselect All`}
                        </Button>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                        {Object.entries(TEST_CONTENT_SAMPLES).map(([key, sample]) => (
                            <label
                                key={key}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem',
                                    border: '1px solid var(--border-norm)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    background: selectedTests.has(key) ? 'var(--background-weak)' : 'transparent',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTests.has(key)}
                                    onChange={() => handleToggleTest(key)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: 500 }}>{sample.name}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-weak)' }}>
                                    {sample.content.length} chars
                                </span>
                            </label>
                        ))}
                    </div>

                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'var(--background-weak)',
                            borderRadius: '4px',
                        }}
                    >
                        <strong>{c('lumo: Test Renderer').t`Selected:`}</strong> {selectedTests.size} /{' '}
                        {Object.keys(TEST_CONTENT_SAMPLES).length}
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('lumo: Test Renderer').t`Cancel`}</Button>
                <Button color="norm" onClick={handleInjectContent} disabled={selectedTests.size === 0}>
                    {c('lumo: Test Renderer').t`Inject Test Content`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
