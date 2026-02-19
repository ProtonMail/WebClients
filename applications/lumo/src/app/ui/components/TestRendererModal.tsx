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

import { useLumoDispatch } from '../../redux/hooks';
import { addMessage } from '../../redux/slices/core/messages';
import type { Message } from '../../types';
import { Role } from '../../types';
import { generateSpaceKeyBase64 } from '../../crypto';
import { addSpace, newSpaceId } from '../../redux/slices/core/spaces';
import { addConversation } from '../../redux/slices/core/conversations';
import type { Conversation, Space } from '../../types';
import { ConversationStatus } from '../../types';

interface TestRendererModalProps {
    open: boolean;
    onClose: () => void;
}

// Test content samples that cover various edge cases
const TEST_CONTENT_SAMPLES = {
    html_divs: {
        name: 'HTML with DIVs (Turndown)',
        content: `<div>This is a test with HTML divs that should trigger turndown conversion.</div><div>Second paragraph in a div.</div><p>And a paragraph tag.</p>`,
    },
    html_complex: {
        name: 'Complex HTML',
        content: `<div><h1>Heading</h1><p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item 1</li><li>Item 2</li></ul></div>`,
    },
    latex_inline: {
        name: 'Inline LaTeX',
        content: `Here's an inline equation: $E = mc^2$ and another: $\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$`,
    },
    latex_block: {
        name: 'Block LaTeX',
        content: `Here's a block equation:\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\nAnd another:\n\n$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$`,
    },
    code_inline: {
        name: 'Inline Code',
        content: `Use the \`console.log()\` function to debug. Also try \`Array.map()\` and \`Promise.all()\`.`,
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
        content: `# Test Document\n\nThis tests **multiple** content types:\n\n## Math\n\nInline: $x^2 + y^2 = z^2$\n\nBlock:\n$$\\frac{d}{dx}(x^n) = nx^{n-1}$$\n\n## Code\n\nInline: \`const x = 42;\`\n\nBlock:\n\`\`\`typescript\ninterface User {\n    id: string;\n    name: string;\n    email: string;\n}\n\nconst user: User = {\n    id: '123',\n    name: 'John',\n    email: 'john@example.com'\n};\n\`\`\`\n\n## Lists\n\n- Item 1\n- Item 2\n  - Nested\n\n1. First\n2. Second\n\n## Quote\n\n> This is a quote\n> with multiple lines\n\n## Table\n\n| Name | Age | City |\n|------|-----|------|\n| Alice | 30 | NYC |\n| Bob | 25 | LA |`,
    },
    special_chars: {
        name: 'Special Characters',
        content: `Testing special chars: © ® ™ € £ ¥ § ¶ † ‡ • … ← → ↑ ↓ ≈ ≠ ≤ ≥ ∞ ∑ ∏ √ ∫ α β γ δ ε`,
    },
    long_text: {
        name: 'Long Text (Performance)',
        content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. `.repeat(100) + `\n\n` + `Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. `.repeat(50),
    },
    empty_content: {
        name: 'Empty Content',
        content: '',
    },
    whitespace: {
        name: 'Whitespace Only',
        content: '   \n\n   \n   ',
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
            // eslint-disable-next-line no-alert
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

        // eslint-disable-next-line no-alert
        alert(`Injected ${selectedTests.size} test cases into ${shouldNavigate ? 'a new' : 'the current'} conversation!`);
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
