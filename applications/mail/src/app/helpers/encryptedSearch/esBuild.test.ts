import { cleanText } from './esBuild';

describe('ESBuild', () => {
    describe('cleanText', () => {
        describe('Plain text', () => {
            it('should not affect regular text', () => {
                const text = cleanText('Hello, World!', true);
                expect(text).toBe('Hello, World!');
            });

            it('should handle text with multiple spaces', () => {
                const text = cleanText('Hello,    World!', true);
                expect(text).toBe('Hello, World!');
            });
        });

        describe('Basic HTML tags', () => {
            it('should remove a simple div tag', () => {
                const text = cleanText('<div>Hello, World!</div>', true);
                expect(text).toBe('Hello, World!');
            });

            it('should remove a single p tag', () => {
                const text = cleanText('<p>Hello, World!</p>', true);
                expect(text).toBe('Hello, World!');
            });

            it('should remove a single span tag', () => {
                const text = cleanText('<span>Hello,</span> <span>World!</span>', true);
                expect(text).toBe('Hello, World!');
            });

            it('should remove image with no alt text', () => {
                const text = cleanText('<img src="image.jpg" />', true);
                expect(text).toBe('');
            });

            it('should remove image with alt text', () => {
                const text = cleanText('<img src="image.jpg" alt="Image" />', true);
                expect(text).toBe('');
            });

            it('should not concatenate words across divs', () => {
                const text = cleanText('<div>cat</div><div>her</div>', true);
                expect(text).toBe('cat\nher');
            });

            it('should handle address tag', () => {
                const text = cleanText('<address>123 Main St<br>City, State 12345</address>', true);
                expect(text).toBe('123 Main St\nCity, State 12345');
            });

            it('should handle subscript', () => {
                const text = cleanText('H<sub>2</sub>O', true);
                expect(text).toBe('H2O');
            });

            it('should handle superscript', () => {
                const text = cleanText('E = mc<sup>2</sup>', true);
                expect(text).toBe('E = mc2');
            });

            it('should handle abbr tag', () => {
                const text = cleanText('<abbr title="HyperText Markup Language">HTML</abbr> is great', true);
                expect(text).toBe('HTML is great');
            });

            it('should handle ruby tag', () => {
                const text = cleanText('<ruby>漢<rp>(</rp><rt>かん</rt><rp>)</rp></ruby>', true);
                expect(text).toBe('漢(かん)');
            });

            it('should handle small tag', () => {
                const text = cleanText('Normal text <small>small print</small>', true);
                expect(text).toBe('Normal text small print');
            });

            it('should handle kbd tag', () => {
                const text = cleanText('Press <kbd>Ctrl</kbd>+<kbd>C</kbd> to copy', true);
                expect(text).toBe('Press Ctrl+C to copy');
            });
        });

        describe('Nested cases', () => {
            it('should handle nested divs', () => {
                const text = cleanText('<div><div>Hello</div><div>World!</div></div>', true);
                expect(text).toBe('Hello\nWorld!');
            });

            it('should handle nested spans', () => {
                const text = cleanText('<span><span>Hello</span><span>World!</span></span>', true);
                expect(text).toBe('HelloWorld!');
            });

            it('should handle div tags with space', () => {
                const text = cleanText('<div>Hello</div> <div>World!</div>', true);
                expect(text).toBe('Hello \nWorld!');
            });

            it('should handle div tags with multiple spaces', () => {
                const text = cleanText('<div>Hello</div>     <div>World!</div>', true);
                expect(text).toBe('Hello \nWorld!');
            });

            it('should handle span tags with space', () => {
                const text = cleanText('<span>Hello</span> <span>World!</span>', true);
                expect(text).toBe('Hello World!');
            });

            it('should handle span tags with multiple spaces', () => {
                const text = cleanText('<span>Hello</span>     <span>World!</span>', true);
                expect(text).toBe('Hello World!');
            });
        });

        describe('Multiple tag tests', () => {
            it('should handle two p tags', () => {
                const text = cleanText('<p>First paragraph</p><p>Second paragraph</p>', true);
                expect(text).toBe('First paragraph\nSecond paragraph');
            });

            it('should handle two p tags with multiple spaces', () => {
                const text = cleanText('<p>First paragraph</p>     <p>Second paragraph</p>', true);
                expect(text).toBe('First paragraph \nSecond paragraph');
            });

            it('should handle two div tags', () => {
                const text = cleanText('<div>First div</div><div>Second div</div>', true);
                expect(text).toBe('First div\nSecond div');
            });

            it('should handle two div tags with multiple spaces', () => {
                const text = cleanText('<div>First div</div>     <div>Second div</div>', true);
                expect(text).toBe('First div \nSecond div');
            });

            it('should handle two span tags', () => {
                const text = cleanText('<span>First span</span><span>Second span</span>', true);
                expect(text).toBe('First spanSecond span');
            });

            it('should handle two span tags with multiple spaces', () => {
                const text = cleanText('<span>First span</span>     <span>Second span</span>', true);
                expect(text).toBe('First span Second span');
            });
        });

        describe('Line breaks', () => {
            it('should handle br tag', () => {
                const text = cleanText('Hello<br>World', true);
                expect(text).toBe('Hello\nWorld');
            });

            it('should handle br self-closing tag', () => {
                const text = cleanText('Hello<br/>World', true);
                expect(text).toBe('Hello\nWorld');
            });

            it('should handle multiple br tags', () => {
                const text = cleanText('Hello<br><br><br>World', true);
                expect(text).toBe(`Hello\nWorld`);
            });

            it('should handle br inside div', () => {
                const text = cleanText('<div>Hello<br>World</div>', true);
                expect(text).toBe('Hello\nWorld');
            });
        });

        describe('Headings', () => {
            it('should handle h1 tag', () => {
                const text = cleanText('<h1>Title</h1>', true);
                expect(text).toBe('Title');
            });

            it('should handle h2 tag', () => {
                const text = cleanText('<h2>Subtitle</h2>', true);
                expect(text).toBe('Subtitle');
            });

            it('should handle h3 tag', () => {
                const text = cleanText('<h3>Section</h3>', true);
                expect(text).toBe('Section');
            });

            it('should handle heading with content after', () => {
                const text = cleanText('<h1>Title</h1><p>Content here</p>', true);
                expect(text).toBe('Title\nContent here');
            });

            it('should handle multiple headings', () => {
                const text = cleanText('<h1>Title</h1><h2>Subtitle</h2><p>Content</p>', true);
                expect(text).toBe('Title\nSubtitle\nContent');
            });
        });

        describe('Lists', () => {
            it('should handle unordered list', () => {
                const text = cleanText('<ul><li>Item 1</li><li>Item 2</li></ul>', true);
                expect(text).toBe('Item 1\nItem 2');
            });

            it('should handle ordered list', () => {
                const text = cleanText('<ol><li>First</li><li>Second</li></ol>', true);
                expect(text).toBe('First\nSecond');
            });

            it('should handle single list item', () => {
                const text = cleanText('<ul><li>Only item</li></ul>', true);
                expect(text).toBe('Only item');
            });

            it('should handle nested lists', () => {
                const text = cleanText('<ul><li>Item 1<ul><li>Nested item</li></ul></li><li>Item 2</li></ul>', true);

                expect(text).toBe('Item 1\nNested item\nItem 2');
            });
        });

        describe('Links', () => {
            it('should handle simple link', () => {
                const text = cleanText('<a href="https://example.com">Click here</a>', true);
                expect(text).toBe('Click here');
            });

            it('should handle link with text around', () => {
                const text = cleanText('Visit <a href="https://example.com">our site</a> for more info.', true);
                expect(text).toBe('Visit our site for more info.');
            });

            it('should handle link without text', () => {
                const text = cleanText('<a href="https://example.com"></a>', true);
                expect(text).toBe('');
            });

            it('should handle multiple links', () => {
                const text = cleanText(
                    '<a href="https://a.com">Link A</a> and <a href="https://b.com">Link B</a>',
                    true
                );
                expect(text).toBe('Link A and Link B');
            });
        });

        describe('Text formatting', () => {
            it('should handle bold text with b tag', () => {
                const text = cleanText('This is <b>bold</b> text', true);
                expect(text).toBe('This is bold text');
            });

            it('should handle bold text with strong tag', () => {
                const text = cleanText('This is <strong>strong</strong> text', true);
                expect(text).toBe('This is strong text');
            });

            it('should handle italic text with i tag', () => {
                const text = cleanText('This is <i>italic</i> text', true);
                expect(text).toBe('This is italic text');
            });

            it('should handle italic text with em tag', () => {
                const text = cleanText('This is <em>emphasized</em> text', true);
                expect(text).toBe('This is emphasized text');
            });

            it('should handle underline text', () => {
                const text = cleanText('This is <u>underlined</u> text', true);
                expect(text).toBe('This is underlined text');
            });

            it('should handle strikethrough text', () => {
                const text = cleanText('This is <s>strikethrough</s> text', true);
                expect(text).toBe('This is strikethrough text');
            });

            it('should handle nested formatting', () => {
                const text = cleanText('This is <b><i>bold and italic</i></b> text', true);
                expect(text).toBe('This is bold and italic text');
            });
        });

        describe('Tables', () => {
            it('should handle simple table', () => {
                const text = cleanText('<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>', true);
                expect(text).toBe('Cell 1\nCell 2');
            });

            it('should handle table with header', () => {
                const text = cleanText(
                    '<table><tr><th>Header 1</th><th>Header 2</th></tr><tr><td>Cell 1</td><td>Cell 2</td></tr></table>',
                    true
                );
                expect(text).toBe('Header 1\nHeader 2\nCell 1\nCell 2');
            });

            it('should handle table with multiple rows', () => {
                const text = cleanText(
                    '<table><tr><td>A1</td><td>B1</td></tr><tr><td>A2</td><td>B2</td></tr><tr><td>A3</td><td>B3</td></tr></table>',
                    true
                );
                expect(text).toBe('A1\nB1\nA2\nB2\nA3\nB3');
            });
        });

        describe('Script and style tags', () => {
            it('should remove script tags', () => {
                const text = cleanText('<div>Content</div><script>alert("test");</script>', true);
                expect(text).toBe('Content');
            });

            it('should remove style tags', () => {
                const text = cleanText('<style>.class { color: red; }</style><div>Content</div>', true);
                expect(text).toBe('Content');
            });

            it('should remove inline script', () => {
                const text = cleanText('<script type="text/javascript">var x = 1;</script><p>Content</p>', true);
                expect(text).toBe('Content');
            });
        });

        describe('HTML comments', () => {
            it('should remove HTML comments', () => {
                const text = cleanText('<!-- First comment --><div>Hello world<!-- Second comment --></div>', true);
                expect(text).toBe('Hello world');
            });
        });

        describe('Images', () => {
            it('should remove remote images from content', () => {
                const text = cleanText(
                    '<img src="https://image.com" alt="image 1"/><div>Hello world<img src="https://image.com" alt="image 2"/></div>',
                    true
                );
                expect(text).toBe('Hello world');
            });

            it('should remove embedded images from content', () => {
                const text = cleanText(
                    '<img src="cid:image1" alt="image 1"/><div>Hello world<img src="cid:image2" alt="image 2"/></div>',
                    true
                );
                expect(text).toBe('Hello world');
            });

            it('should remove b64 images from content', () => {
                const text = cleanText(
                    '<img src="data:image/b64content" alt="image 1"/><div>Hello world<img src="data:image/b64content" alt="image 2"/></div>',
                    true
                );
                expect(text).toBe('Hello world');
            });
        });

        // TODO should we strip those elements if present in the HTML?
        describe('Video and audio elements', () => {
            it('should handle video tag', () => {
                const text = cleanText('<video src="test.mp4">Video not supported</video>', true);
                expect(text).toBe('Video not supported');
            });

            it('should handle audio tag', () => {
                const text = cleanText('<audio src="test.mp3">Audio not supported</audio>', true);
                expect(text).toBe('Audio not supported');
            });
        });

        // TODO should we strip those elements if present in the HTML?
        describe('Canvas and SVG', () => {
            it('should handle canvas tag', () => {
                const text = cleanText('<canvas>Canvas not supported</canvas>', true);
                expect(text).toBe('Canvas not supported');
            });

            it('should handle svg tag', () => {
                const text = cleanText('<svg><text>SVG Text</text></svg>', true);
                expect(text).toBe('SVG Text');
            });
        });

        // TODO should we strip those elements if present in the HTML?
        describe('Noscript element', () => {
            it('should handle noscript tag', () => {
                const text = cleanText('<noscript>JavaScript is required</noscript>', true);
                expect(text).toBe('JavaScript is required');
            });
        });

        describe('Special characters and entities', () => {
            it('should handle HTML entities - nbsp', () => {
                const text = cleanText('Hello&nbsp;World', true);
                expect(text).toBe('Hello World');
            });

            it('should handle HTML entities - amp', () => {
                const text = cleanText('Tom &amp; Jerry', true);
                expect(text).toBe('Tom & Jerry');
            });

            it('should handle HTML entities - lt gt', () => {
                const text = cleanText('1 &lt; 2 &gt; 0', true);
                expect(text).toBe('1 < 2 > 0');
            });

            it('should handle HTML entities - quotes', () => {
                const text = cleanText('&quot;Quoted&quot; text', true);
                expect(text).toBe('"Quoted" text');
            });

            it('should handle unicode characters', () => {
                const text = cleanText('<div>Hello 👋 World 🌍</div>', true);
                expect(text).toBe('Hello 👋 World 🌍');
            });

            it('should handle accented characters', () => {
                const text = cleanText('<div>Café résumé naïve</div>', true);
                expect(text).toBe('Café résumé naïve');
            });
        });

        describe('Blockquote', () => {
            it('should handle blockquote', () => {
                const text = cleanText('<blockquote>This is a quote</blockquote>', true);
                expect(text).toBe('This is a quote');
            });

            it('should handle blockquote with attribution', () => {
                const text = cleanText('<blockquote>Famous quote</blockquote><cite>- Author</cite>', true);

                expect(text).toBe('Famous quote- Author');
            });
        });

        describe('Code blocks', () => {
            it('should handle inline code', () => {
                const text = cleanText('Use <code>console.log()</code> to debug', true);
                expect(text).toBe('Use console.log() to debug');
            });

            it('should handle pre tag', () => {
                const text = cleanText('<pre>function test() {\n  return true;\n}</pre>', true);
                expect(text).toBe('function test() {\nreturn true;\n}');
            });

            it('should handle pre with code', () => {
                const text = cleanText('<pre><code>const x = 1;</code></pre>', true);
                expect(text).toBe('const x = 1;');
            });
        });

        describe('Horizontal rule', () => {
            it('should handle hr tag', () => {
                const text = cleanText('<div>Above</div><hr><div>Below</div>', true);
                expect(text).toBe('Above\nBelow');
            });

            it('should handle hr self-closing', () => {
                const text = cleanText('<p>Section 1</p><hr/><p>Section 2</p>', true);
                expect(text).toBe('Section 1\nSection 2');
            });
        });

        describe('Email content patterns', () => {
            it('should handle Outlook-style email', () => {
                const text = cleanText(
                    '<div class="WordSection1"><p class="MsoNormal">Hello,</p><p class="MsoNormal">&nbsp;</p><p class="MsoNormal">This is a test.</p></div>',
                    true
                );
                expect(text).toBe('Hello,\nThis is a test.');
            });

            it('should handle Gmail-style email', () => {
                const text = cleanText(
                    '<div dir="ltr"><div>Hello,</div><div><br></div><div>This is a test.</div></div>',
                    true
                );
                expect(text).toBe('Hello,\nThis is a test.');
            });

            it('should handle Apple Mail style', () => {
                const text = cleanText(
                    '<div><div style="word-wrap: break-word;">Hello,<div><br></div><div>This is a test.</div></div></div>',
                    true
                );
                expect(text).toBe('Hello,\nThis is a test.');
            });

            it('should handle newsletter with multiple sections', () => {
                const text = cleanText(
                    '<table><tr><td><h2>Section 1</h2><p>Content 1</p></td></tr><tr><td><h2>Section 2</h2><p>Content 2</p></td></tr></table>',
                    true
                );
                expect(text).toBe('Section 1\nContent 1\nSection 2\nContent 2');
            });
        });

        describe('Edge cases', () => {
            it('should handle empty string', () => {
                const text = cleanText('', true);
                expect(text).toBe('');
            });

            it('should handle only whitespace', () => {
                const text = cleanText('   ', true);
                expect(text).toBe('');
            });

            it('should handle malformed HTML - unclosed tag', () => {
                const text = cleanText('<div>Unclosed', true);
                expect(text).toBe('Unclosed');
            });

            it('should handle malformed HTML - extra closing tag', () => {
                const text = cleanText('<div>Text</div></div>', true);
                expect(text).toBe('Text');
            });

            it('should handle deeply nested structure', () => {
                const text = cleanText('<div><div><div><div><span>Deep</span></div></div></div></div>', true);
                expect(text).toBe('Deep');
            });

            it('should handle self-closing tags', () => {
                const text = cleanText('<div>Before<input type="text"/>After</div>', true);
                expect(text).toBe('BeforeAfter');
            });

            it('should handle comment tags', () => {
                const text = cleanText('<div>Before<!-- This is a comment -->After</div>', true);
                expect(text).toBe('BeforeAfter');
            });
        });

        describe('More complex email-like structures', () => {
            it('should handle typical email signature', () => {
                const text = cleanText('<div>Best regards,</div><div>John Doe</div><div>CEO, Company Inc.</div>', true);
                expect(text).toBe('Best regards,\nJohn Doe\nCEO, Company Inc.');
            });

            it('should handle email with greeting and body', () => {
                const text = cleanText(
                    '<div>Hi there,</div><br><div>Hope this email finds you well.</div><br><div>Best,</div><div>Jane</div>',
                    true
                );
                expect(text).toBe('Hi there,\nHope this email finds you well.\nBest,\nJane');
            });

            it('should handle email with bullet points', () => {
                const text = cleanText(
                    '<div>Please note:</div><ul><li>Point one</li><li>Point two</li><li>Point three</li></ul><div>Thanks!</div>',
                    true
                );
                expect(text).toBe('Please note:\nPoint one\nPoint two\nPoint three\nThanks!');
            });

            it('should handle forwarded email header', () => {
                const text = cleanText(
                    '<div>---------- Forwarded message ---------</div><div>From: sender@example.com</div><div>Date: Mon, Jan 1, 2024</div><div>Subject: Test</div>',
                    true
                );
                expect(text).toBe(
                    '---------- Forwarded message ---------\nFrom: sender@example.com\nDate: Mon, Jan 1, 2024\nSubject: Test'
                );
            });
        });
    });
});
