import { cleanText } from './esBuild';

describe('ESBuild', () => {
    describe('cleanText', () => {
        const compareCleanText = (html: string, includeQuote = true) => {
            const withTurndown = cleanText(html, includeQuote, false);
            const withoutTurndown = cleanText(html, includeQuote, true);
            console.table({ withTurndown, withoutTurndown });
            return { withTurndown, withoutTurndown };
        };

        describe('Plain text', () => {
            it('should not affect regular text', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('Hello, World!');
                expect(withTurndown).toBe('Hello, World!');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle text with multiple spaces', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('Hello,    World!');
                expect(withTurndown).toBe('Hello, World!');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Basic HTML tags', () => {
            it('should remove a simple div tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>Hello, World!</div>');
                expect(withTurndown).toBe('Hello, World!');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should remove a single p tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<p>Hello, World!</p>');
                expect(withTurndown).toBe('Hello, World!');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should remove a single span tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<span>Hello,</span> <span>World!</span>');
                expect(withTurndown).toBe('Hello, World!');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should remove image with no alt text', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<img src="image.jpg" />');
                expect(withTurndown).toBe('');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should remove image with alt text', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<img src="image.jpg" alt="Image" />');
                expect(withTurndown).toBe('');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should not concatenate words across divs', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>cat</div><div>her</div>');
                expect(withTurndown).toBe('cat\nher');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle address tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<address>123 Main St<br>City, State 12345</address>'
                );
                expect(withTurndown).toBe('123 Main St\nCity, State 12345');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle subscript', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('H<sub>2</sub>O');
                expect(withTurndown).toBe('H2O');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle superscript', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('E = mc<sup>2</sup>');
                expect(withTurndown).toBe('E = mc2');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle abbr tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<abbr title="HyperText Markup Language">HTML</abbr> is great'
                );
                expect(withTurndown).toBe('HTML is great');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle ruby tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<ruby>漢<rp>(</rp><rt>かん</rt><rp>)</rp></ruby>'
                );
                expect(withTurndown).toBe('漢(かん)');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle small tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('Normal text <small>small print</small>');
                expect(withTurndown).toBe('Normal text small print');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle kbd tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    'Press <kbd>Ctrl</kbd>+<kbd>C</kbd> to copy'
                );
                expect(withTurndown).toBe('Press Ctrl+C to copy');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Nested cases', () => {
            it('should handle nested divs', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div><div>Hello</div><div>World!</div></div>'
                );
                expect(withTurndown).toBe('Hello\nWorld!');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle nested spans', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<span><span>Hello</span><span>World!</span></span>'
                );
                expect(withTurndown).toBe('HelloWorld!');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle div tags with space', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>Hello</div> <div>World!</div>');
                expect(withTurndown).toBe('Hello\nWorld!');
                expect(withoutTurndown).toBe('Hello \nWorld!');
            });

            it('should handle div tags with multiple spaces', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>Hello</div>     <div>World!</div>');
                expect(withTurndown).toBe('Hello\nWorld!');
                expect(withoutTurndown).toBe('Hello \nWorld!');
            });

            it('should handle span tags with space', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<span>Hello</span> <span>World!</span>');
                expect(withTurndown).toBe('Hello World!');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle span tags with multiple spaces', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<span>Hello</span>     <span>World!</span>'
                );
                expect(withTurndown).toBe('Hello World!');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Multiple tag tests', () => {
            it('should handle two p tags', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<p>First paragraph</p><p>Second paragraph</p>'
                );
                expect(withTurndown).toBe('First paragraph\nSecond paragraph');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle two p tags with multiple spaces', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<p>First paragraph</p>     <p>Second paragraph</p>'
                );
                expect(withTurndown).toBe('First paragraph\nSecond paragraph');
                expect(withoutTurndown).toBe('First paragraph \nSecond paragraph');
            });

            it('should handle two div tags', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>First div</div><div>Second div</div>');
                expect(withTurndown).toBe('First div\nSecond div');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle two div tags with multiple spaces', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div>First div</div>     <div>Second div</div>'
                );
                expect(withTurndown).toBe('First div\nSecond div');
                expect(withoutTurndown).toBe('First div \nSecond div');
            });

            it('should handle two span tags', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<span>First span</span><span>Second span</span>'
                );
                expect(withTurndown).toBe('First spanSecond span');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle two span tags with multiple spaces', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<span>First span</span>     <span>Second span</span>'
                );
                expect(withTurndown).toBe('First span Second span');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Line breaks', () => {
            it('should handle br tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('Hello<br>World');
                expect(withTurndown).toBe('Hello\nWorld');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle br self-closing tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('Hello<br/>World');
                expect(withTurndown).toBe('Hello\nWorld');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle multiple br tags', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('Hello<br><br><br>World');
                expect(withTurndown).toBe(`Hello\nWorld`);
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle br inside div', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>Hello<br>World</div>');
                expect(withTurndown).toBe('Hello\nWorld');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Headings', () => {
            it('should handle h1 tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<h1>Title</h1>');
                expect(withTurndown).toBe('Title\n=====');
                expect(withoutTurndown).toBe('Title');
            });

            it('should handle h2 tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<h2>Subtitle</h2>');
                expect(withTurndown).toBe('Subtitle\n--------');
                expect(withoutTurndown).toBe('Subtitle');
            });

            it('should handle h3 tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<h3>Section</h3>');
                expect(withTurndown).toBe('### Section');
                expect(withoutTurndown).toBe('Section');
            });

            it('should handle heading with content after', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<h1>Title</h1><p>Content here</p>');
                expect(withTurndown).toBe('Title\n=====\nContent here');
                expect(withoutTurndown).toBe('Title\nContent here');
            });

            it('should handle multiple headings', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<h1>Title</h1><h2>Subtitle</h2><p>Content</p>'
                );
                expect(withTurndown).toBe('Title\n=====\nSubtitle\n--------\nContent');
                expect(withoutTurndown).toBe('Title\nSubtitle\nContent');
            });
        });

        describe('Lists', () => {
            it('should handle unordered list', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<ul><li>Item 1</li><li>Item 2</li></ul>');
                expect(withTurndown).toBe('-   Item 1\n-   Item 2');
                expect(withoutTurndown).toBe('Item 1\nItem 2');
            });

            it('should handle ordered list', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<ol><li>First</li><li>Second</li></ol>');
                expect(withTurndown).toBe('1.  First\n2.  Second');
                expect(withoutTurndown).toBe('First\nSecond');
            });

            it('should handle single list item', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<ul><li>Only item</li></ul>');
                expect(withTurndown).toBe('-   Only item');
                expect(withoutTurndown).toBe('Only item');
            });

            it('should handle nested lists', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<ul><li>Item 1<ul><li>Nested item</li></ul></li><li>Item 2</li></ul>'
                );

                expect(withTurndown).toBe('-   Item 1\n    -   Nested item\n-   Item 2');
                expect(withoutTurndown).toBe('Item 1\nNested item\nItem 2');
            });
        });

        describe('Links', () => {
            it('should handle simple link', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<a href="https://example.com">Click here</a>'
                );
                expect(withTurndown).toBe('Click here');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle link with text around', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    'Visit <a href="https://example.com">our site</a> for more info.'
                );
                expect(withTurndown).toBe('Visit our site for more info.');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle link without text', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<a href="https://example.com"></a>');
                expect(withTurndown).toBe('');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle multiple links', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<a href="https://a.com">Link A</a> and <a href="https://b.com">Link B</a>'
                );
                expect(withTurndown).toBe('Link A and Link B');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Text formatting', () => {
            it('should handle bold text with b tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('This is <b>bold</b> text');
                expect(withoutTurndown).toBe('This is bold text');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle bold text with strong tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('This is <strong>strong</strong> text');
                expect(withoutTurndown).toBe('This is strong text');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle italic text with i tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('This is <i>italic</i> text');
                expect(withoutTurndown).toBe('This is italic text');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle italic text with em tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('This is <em>emphasized</em> text');
                expect(withoutTurndown).toBe('This is emphasized text');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle underline text', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('This is <u>underlined</u> text');
                expect(withoutTurndown).toBe('This is underlined text');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle strikethrough text', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('This is <s>strikethrough</s> text');
                expect(withoutTurndown).toBe('This is strikethrough text');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle nested formatting', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    'This is <b><i>bold and italic</i></b> text'
                );
                expect(withoutTurndown).toBe('This is bold and italic text');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Tables', () => {
            it('should handle simple table', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>'
                );
                expect(withoutTurndown).toBe('Cell 1\nCell 2');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle table with header', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<table><tr><th>Header 1</th><th>Header 2</th></tr><tr><td>Cell 1</td><td>Cell 2</td></tr></table>'
                );
                expect(withoutTurndown).toBe('Header 1\nHeader 2\nCell 1\nCell 2');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle table with multiple rows', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<table><tr><td>A1</td><td>B1</td></tr><tr><td>A2</td><td>B2</td></tr><tr><td>A3</td><td>B3</td></tr></table>'
                );
                expect(withoutTurndown).toBe('A1\nB1\nA2\nB2\nA3\nB3');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Script and style tags', () => {
            it('should remove script tags', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div>Content</div><script>alert("test");</script>'
                );
                expect(withoutTurndown).toBe('Content');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should remove style tags', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<style>.class { color: red; }</style><div>Content</div>'
                );
                expect(withoutTurndown).toBe('Content');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should remove inline script', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<script type="text/javascript">var x = 1;</script><p>Content</p>'
                );
                expect(withoutTurndown).toBe('Content');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('HTML comments', () => {
            it('should remove HTML comments', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<!-- First comment --><div>Hello world<!-- Second comment --></div>'
                );
                expect(withoutTurndown).toBe('Hello world');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Images', () => {
            it('should remove remote images from content', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<img src="https://image.com" alt="image 1"/><div>Hello world<img src="https://image.com" alt="image 2"/></div>'
                );
                expect(withoutTurndown).toBe('Hello world');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should remove embedded images from content', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<img src="cid:image1" alt="image 1"/><div>Hello world<img src="cid:image2" alt="image 2"/></div>'
                );
                expect(withoutTurndown).toBe('Hello world');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should remove b64 images from content', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<img src="data:image/b64content" alt="image 1"/><div>Hello world<img src="data:image/b64content" alt="image 2"/></div>'
                );
                expect(withoutTurndown).toBe('Hello world');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        // TODO should we strip those elements if present in the HTML?
        describe('Video and audio elements', () => {
            it('should handle video tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<video src="test.mp4">Video not supported</video>'
                );
                expect(withoutTurndown).toBe('Video not supported');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle audio tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<audio src="test.mp3">Audio not supported</audio>'
                );
                expect(withoutTurndown).toBe('Audio not supported');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        // TODO should we strip those elements if present in the HTML?
        describe('Canvas and SVG', () => {
            it('should handle canvas tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<canvas>Canvas not supported</canvas>');
                expect(withoutTurndown).toBe('Canvas not supported');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle svg tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<svg><text>SVG Text</text></svg>');
                expect(withoutTurndown).toBe('SVG Text');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        // TODO should we strip those elements if present in the HTML?
        describe('Noscript element', () => {
            it('should handle noscript tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<noscript>JavaScript is required</noscript>'
                );
                console.table({ withTurndown, withoutTurndown });
                expect(withoutTurndown).toBe('JavaScript is required');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Special characters and entities', () => {
            it('should handle HTML entities - nbsp', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('Hello&nbsp;World');
                expect(withoutTurndown).toBe('Hello World');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle HTML entities - amp', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('Tom &amp; Jerry');
                expect(withoutTurndown).toBe('Tom & Jerry');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle HTML entities - lt gt', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('1 &lt; 2 &gt; 0');
                expect(withoutTurndown).toBe('1 < 2 > 0');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle HTML entities - quotes', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('&quot;Quoted&quot; text');
                expect(withoutTurndown).toBe('"Quoted" text');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle unicode characters', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>Hello 👋 World 🌍</div>');
                expect(withoutTurndown).toBe('Hello 👋 World 🌍');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle accented characters', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>Café résumé naïve</div>');
                expect(withoutTurndown).toBe('Café résumé naïve');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Blockquote', () => {
            it('should handle blockquote', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<blockquote>This is a quote</blockquote>');
                expect(withTurndown).toBe('> This is a quote');
                expect(withoutTurndown).toBe('This is a quote');
            });

            it('should handle blockquote with attribution', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<blockquote>Famous quote</blockquote><cite>- Author</cite>'
                );

                expect(withTurndown).toBe('> Famous quote\n- Author');
                expect(withoutTurndown).toBe('Famous quote- Author');
            });
        });

        describe('Code blocks', () => {
            it('should handle inline code', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('Use <code>console.log()</code> to debug');
                expect(withTurndown).toBe('Use `console.log()` to debug');
                expect(withoutTurndown).toBe('Use console.log() to debug');
            });

            it('should handle pre tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<pre>function test() {\n  return true;\n}</pre>'
                );
                expect(withTurndown).toBe('function test() {\n  return true;\n}');
                expect(withoutTurndown).toBe('function test() {\nreturn true;\n}');
            });

            it('should handle pre with code', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<pre><code>const x = 1;</code></pre>');
                expect(withTurndown).toBe('const x = 1;');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Horizontal rule', () => {
            it('should handle hr tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>Above</div><hr><div>Below</div>');
                expect(withTurndown).toBe('Above\nBelow');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle hr self-closing', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<p>Section 1</p><hr/><p>Section 2</p>');
                expect(withTurndown).toBe('Section 1\nSection 2');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('Email content patterns', () => {
            it('should handle Outlook-style email', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div class="WordSection1"><p class="MsoNormal">Hello,</p><p class="MsoNormal">&nbsp;</p><p class="MsoNormal">This is a test.</p></div>'
                );
                expect(withTurndown).toBe('Hello,\nThis is a test.');
                expect(withTurndown).toBe(withoutTurndown);
            });

            it('should handle Gmail-style email', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div dir="ltr"><div>Hello,</div><div><br></div><div>This is a test.</div></div>'
                );
                expect(withTurndown).toBe('Hello,\nThis is a test.');
                expect(withTurndown).toBe(withoutTurndown);
            });

            it('should handle Apple Mail style', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div><div style="word-wrap: break-word;">Hello,<div><br></div><div>This is a test.</div></div></div>'
                );
                expect(withTurndown).toBe('Hello,\nThis is a test.');
                expect(withTurndown).toBe(withoutTurndown);
            });

            it('should handle newsletter with multiple sections', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<table><tr><td><h2>Section 1</h2><p>Content 1</p></td></tr><tr><td><h2>Section 2</h2><p>Content 2</p></td></tr></table>'
                );
                expect(withTurndown).toBe('Section 1\n---------\nContent 1\nSection 2\n---------\nContent 2');
                expect(withoutTurndown).toBe('Section 1\nContent 1\nSection 2\nContent 2');
            });
        });

        describe('Edge cases', () => {
            it('should handle empty string', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('');
                expect(withTurndown).toBe('');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle only whitespace', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('   ');
                expect(withTurndown).toBe('');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle malformed HTML - unclosed tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>Unclosed');
                expect(withTurndown).toBe('Unclosed');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle malformed HTML - extra closing tag', () => {
                const { withTurndown, withoutTurndown } = compareCleanText('<div>Text</div></div>');
                expect(withTurndown).toBe('Text');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle deeply nested structure', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div><div><div><div><span>Deep</span></div></div></div></div>'
                );
                expect(withTurndown).toBe('Deep');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle self-closing tags', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div>Before<input type="text"/>After</div>'
                );
                expect(withTurndown).toBe('BeforeAfter');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle comment tags', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div>Before<!-- This is a comment -->After</div>'
                );
                expect(withTurndown).toBe('BeforeAfter');
                expect(withoutTurndown).toBe(withTurndown);
            });
        });

        describe('More complex email-like structures', () => {
            it('should handle typical email signature', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div>Best regards,</div><div>John Doe</div><div>CEO, Company Inc.</div>'
                );
                expect(withoutTurndown).toBe('Best regards,\nJohn Doe\nCEO, Company Inc.');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle email with greeting and body', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div>Hi there,</div><br><div>Hope this email finds you well.</div><br><div>Best,</div><div>Jane</div>'
                );
                expect(withoutTurndown).toBe('Hi there,\nHope this email finds you well.\nBest,\nJane');
                expect(withoutTurndown).toBe(withTurndown);
            });

            it('should handle email with bullet points', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div>Please note:</div><ul><li>Point one</li><li>Point two</li><li>Point three</li></ul><div>Thanks!</div>'
                );
                expect(withTurndown).toBe('Please note:\n-   Point one\n-   Point two\n-   Point three\nThanks!');
                expect(withoutTurndown).toBe('Please note:\nPoint one\nPoint two\nPoint three\nThanks!');
            });

            it('should handle forwarded email header', () => {
                const { withTurndown, withoutTurndown } = compareCleanText(
                    '<div>---------- Forwarded message ---------</div><div>From: sender@example.com</div><div>Date: Mon, Jan 1, 2024</div><div>Subject: Test</div>'
                );
                expect(withoutTurndown).toBe(
                    '---------- Forwarded message ---------\nFrom: sender@example.com\nDate: Mon, Jan 1, 2024\nSubject: Test'
                );
                expect(withoutTurndown).toBe(withTurndown);
            });
        });
    });
});
