import { base64Cache, clearAll } from '../../test/helper';
import { attachBase64, transformEscape } from '../transformEscape';

describe('transformEscape', () => {
    const babase64 = `src="data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAABoIAAAVSCAYAAAAisOk2AAAMS2lDQ1BJQ0MgUHJv
    ZmlsZQAASImVVwdYU8kWnltSSWiBUKSE3kQp0qWE0CIISBVshCSQUGJMCCJ2FlkF
    1y4ioK7oqoiLrgWQtaKudVHs/aGIysq6WLCh8iYF1tXvvfe9831z758z5/ynZO69
    MwDo1PKk0jxUF4B8SYEsITKUNTEtnUXqAgSgD1AwGozk8eVSdnx8DIAydP+nvLkO"`;

    const DOM = `
        <section>
            <svg id="svigi" width="5cm" height="4cm" version="1.1"
                xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <image xlink:href="firefox.jpg" x="0" y="0" height="50px" width="50px" />
                <image xlink:href="chrome.jpg" x="0" y="0" height="50px" width="50px" />
                <image href="svg-href.jpg" x="0" y="0" height="50px" width="50px" />
            </svg>
            <div>
                <img border="0" usemap="#fp"  src="cats.jpg ">
                <map name="fp">
                    <area coords="0,0,800,800" href="proton_exploit.html" shape="rect" target="_blank" >
                </map>
            </div>

            <img src="mon-image.jpg" srcset="mon-imageHD.jpg 2x" width="" height="" alt="">
            <img src="lol-image.jpg" srcset="lol-imageHD.jpg 2x" width="" height="" alt="">
            <img data-src="lol-image.jpg" width="" height="" alt="">
            <a href="lol-image.jpg">Alll</a>
            <a href="jeanne-image.jpg">Alll</a>
            <div background="jeanne-image.jpg">Alll</div>
            <div background="jeanne-image2.jpg">Alll</div>
            <p style="font-size:10.0pt;font-family:\\2018Calibri\\2019;color:black">
                Example style that caused regexps to crash
            </p>

            <img id="babase64" ${babase64}/>
        </section>
    `;

    const CODE_HTML_HIGHLIGHT = `
        <div style="white-space: normal;" class="pre"><div style="color: #fff;max-inline-size: 100%;font-size: 16px;line-height: 1.3;" class="code"><span style="color: #DDDDDF;" class="nt">&lt;script</span> <span style="color: #84868B;" class="na">src="</span><span style="color: #68BEA2;" class="s"><span class="s">https<span>://</span>use.fontawesome<span>.</span>com/f0d8991ea9.js</span><span style="color: #84868B;" class="na">"</span><span style="color: #DDDDDF;" class="nt">&gt;</span><span style="color: #DDDDDF;" class="nt">&lt;/script&gt;</span></span></div></div><div class="pre"></div>
    `;
    const HTML_LINKS = `
        <div>
            <a href="http://www.dewdwesrcset-dewdw.com/?srcset=de&srcset=Dewdwe"></a>
            <a href="http://www.dewdwesrc-dewdw.com/?src=de&src=Dewdwe"></a>
            <a href="http://www.dewdwebackground-dewdw.com/?background=de&background=Dewdwe"></a>
            <a href="http://www.dewdweposter-dewdw.com/?poster=de&poster=Dewdwe"></a>
            <a href="http://www.google.nl/?url=a"></a>
            <a href="http://www.google.nl/?src=a&srcset=dew"></a>
        </div>
    `;
    const CODE_HTML = '<pre><code><img src="polo.fr"></code></pre>';
    const CODE_HTML_ESCAPED = '<pre><code><img proton-src="polo.fr"></code></pre>';
    const CODE_TEXT = "<pre><code>{ background: url('monique.jpg') }</code></pre>";
    const TEXT = '<p>salut monique est ceque tu as un src="lol" dans la poche ?</p><span>src=</span>';
    const EDGE_CASE =
        '<div id="ymail_android_signature"><a href="https://overview.mail.yahoo.com/mobile/?.src=Android">Sent from Yahoo Mail on Android</a></div>';
    const EDGE_CASE_2 = `
        webEngineView->setUrl("
        <span>webEngineView->setUrl("</span>
        <div>webEngineView->setUrl("</div>
        <pre>webEngineView->setUrl("</pre>
        <code>webEngineView->setUrl(".</code>
    `;

    const EX_URL = '<div style="background: url(\'https://i.imgur.com/WScAnHr.jpg\')">ddewdwed</div>';
    const EX_URL_CLEAN = '<div style="background: proton-url(\'https://i.imgur.com/WScAnHr.jpg\')">ddewdwed</div>';
    const BACKGROUND_URL = `
        <div style="background: url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>
        <div style="color: red; background: #ffffff url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>
        <div style="color: red; background:    url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>
        <div style="color: red; background:url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>
        <span style="color: red; background:url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</span>`;
    const BACKGROUND_URL_ESCAPED_WTF =
        '<div style="inline-size: 500px; block-size: 500px; background:u\\rl(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>';

    // DON'T REMOVE THEM
    const BACKGROUND_URL_ESCAPED_WTF2 = `
        <div style="inline-size: 500px; block-size: 500px; background:url(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 500px; background:u&#114;l(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 500px; background:ur&#108;(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
    `;
    const BACKGROUND_URL_ESCAPED = `
        <div style="inline-size: 500px; block-size: 500px; background:&#117;rl(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 500px; background:&#117;rl(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 500px; background:&#117;rl(&apos;https://i.imgur.com/WScAnHr.jpg&apos;)">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 500px; content: &quot; ass &quot;; background:url(https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 500px; content: &quot; ass &quot;; background:url(https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 120px; content: &quot; ass &quot;; background:&#117;&#114;&#108;(https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 120px; content: &quot; ass &quot;; background:&#117;r&#108;(https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 120px; content: &quot; ass &quot;; background: u&#114l(https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 500px; content: &quot; ass &quot;; background:url&#x00028;https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 500px; content: &quot; ass &quot;; background:url&lpar;https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="inline-size: 500px; block-size: 456px; content: &quot; ass &quot;; background:url&#40;https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
    `;

    const BACKGROUND_URL_OCTAL_HEX_ENCODING = `
        <div style="background: \\75&#114\\6C('https://TRACKING1/')">test1</div>
        <div style="background: \\75&#114;\\6C('https://TRACKING2/')">test2</div>
        <div style="background: \\75r&#108('https://TRACKING3/')">test3</div>
        <div style="background: &#117r\\6c('https://TRACKING4/')">test4</div>
        <div style="background: \\75 \\72 \\6C ('https://TRACKING5/')">test5</div>
        <div style="background: \\75\\72\\6c ('https://TRACKING6/')">test6</div>
        <div style="background: \\75\\72\\6C('https://TRACKING7/')">test7</div>
        <div style="background: \\75\\72\\6c('https://TRACKING8/')">test8</div>
        <div style="background: \x75\x72\x6C('https://TRACKING9/')">test9</div>
        <div style="background: \u0075\u0072\u006c('https://TRACKING10/')">test10</div>
        <div style="background: &#x75r\\6c('https://TRACKING11/')">test11</div>
        <div style="background: \\75&#x72;\\6C('https://TRACKING12/')">test12</div>
        <div style="background: \\75r&#x6c;('https://TRACKING13/')">test13</div>
        <div style="background: \\75r&#x6c;('https://TRACKING14/')">test14</div>
    `;

    const BACKGROUND_URL_SAFE = `
        <span>url('dewd')</span>
        <span>style="dewdw" url('dewd')</span>
        <span>dew style="dewdw" url('dewd')</span>
        <span>dew style="dewdw": url(</span>
        <span>dew style="content: \\"a\\"": url(</span>
        <span>dew style="content: 'a": url(</span>
        <span>dew style="content: \\"a": url(</span>
    `;

    // TODO: Fix those 2
    // <div style="inline-size: 500px; block-size: 500px; content: &quot; background:url(test)&quot;">ddewdwed</div>
    // <div style="inline-size: 500px; block-size: 500px; content: &apos; background:url(test)&apos;">ddewdwed</div>

    // Firefox support image-set :/
    // https://jira.protontech.ch/browse/MAILWEB-2993
    const BACKGROUND_IMAGE_SET = `
        <div style='background: image-set("https://TRACKING/");'>
    `;

    // That's a nasty one!
    const BACKGROUND_DOUBLE_ESCAPING = `
        <div style="background: ur\\\\5C\\\\6C(https://TRACKING/); /* url( */"></div>
    `;

    const setup = (content = DOM) => {
        const doc = transformEscape(content, base64Cache);

        const querySelector = (selectors: string) => doc.querySelector(selectors);
        const querySelectorAll = (selectors: string) => [...doc.querySelectorAll(selectors)];

        return { document: doc, querySelector, querySelectorAll };
    };

    afterEach(clearAll);

    describe('Replace base64', () => {
        describe('No syntax hightlighting', () => {
            const getBase64Image = () => {
                const { querySelector } = setup();
                return querySelector('img[data-proton-replace-base]') as HTMLImageElement;
            };

            it('should remove the base64 from src', () => {
                const image = getBase64Image();
                expect(image.src).toBe('');
                expect(image.hasAttribute('src')).toBe(false);
            });

            it('should add a custom marker attribute', () => {
                const image = getBase64Image();
                expect(image.hasAttribute('data-proton-replace-base')).toBe(true);
                expect(image.getAttribute('data-proton-replace-base')).not.toBe('');
            });

            it('should add a custom marker attribute with a hash available inside the cache', () => {
                const image = getBase64Image();
                const [hash] = base64Cache.keys();
                expect(image.getAttribute('data-proton-replace-base')).toBe(hash);
                expect(base64Cache.get(hash)).toBe(babase64);
            });

            it('should attach the base64', () => {
                const { document, querySelector } = setup();
                attachBase64(document, base64Cache);
                const image = querySelector('img[src*=base64]') as HTMLImageElement;

                expect(image.hasAttribute('data-proton-replace-base')).toBe(false);
                expect(image.hasAttribute('src')).toBe(true);

                const value = babase64.replace(/^src="/, '').slice(0, 20);
                expect(image.src.startsWith(value)).toBe(true);
            });
        });

        describe('Syntax hightlighting', () => {
            it('should not escape inside a <code> tag', () => {
                const { document } = setup(CODE_HTML_HIGHLIGHT);
                expect(document.innerHTML).not.toMatch(/proton-/);
            });
        });
    });

    describe('Escape <pre>', () => {
        describe('No syntax hightlighting', () => {
            it('should escape inside a <code> tag', () => {
                const { querySelector } = setup(CODE_HTML);
                expect(querySelector('body')?.innerHTML).toBe(CODE_HTML_ESCAPED);
            });

            it('should not escape text inside a <code> tag', () => {
                const { querySelector } = setup(CODE_TEXT);
                expect(querySelector('body')?.innerHTML).toBe(CODE_TEXT);
            });
        });

        describe('Syntax hightlighting', () => {
            it('should not escape inside a <code> tag', () => {
                const { document } = setup(CODE_HTML_HIGHLIGHT);
                expect(document.innerHTML).not.toMatch(/proton-/);
            });
        });
    });

    describe('Escape everything with proton-', () => {
        const getAttribute = (attribute: string) => {
            const { querySelectorAll } = setup();
            return querySelectorAll(`[${attribute}]`);
        };

        describe('Add a prefix', () => {
            it('should not add the prefix before href on a link', () => {
                const list = getAttribute('proton-href');
                expect(list.filter((element) => element.tagName === 'A').length).toBe(0);
            });

            it('should add the prefix before src', () => {
                const list = getAttribute('proton-src');
                expect(list.length).toBe(3);
            });

            it('should add the prefix before data-src', () => {
                const list = getAttribute('proton-data-src');
                expect(list.length).toBe(1);
            });

            it('should add the prefix before srcset', () => {
                const list = getAttribute('proton-srcset');
                expect(list.length).toBe(2);
            });

            it('should add the prefix before background', () => {
                const list = getAttribute('proton-background');
                expect(list.length).toBe(2);
            });
        });

        describe('SVG have been totally discontinuated, should be removed, not prefixed!', () => {
            it('should not add the prefix for SVG', () => {
                const { querySelectorAll } = setup();
                const list = querySelectorAll('proton-svg');
                expect(list.length).toBe(0);
            });

            it('should not add the prefix for xlink:href', () => {
                const { document } = setup();
                const list = document.innerHTML.match(/proton-xlink:href/g);
                expect(list?.length).toBeUndefined();
            });

            it('should not add the prefix for svg href', () => {
                const { querySelector } = setup();
                const svgHref = querySelector('[proton-href="svg-href.jpg"]');
                expect(svgHref).toBe(null);
            });
        });

        describe('Excape all the things !', () => {
            it('should have escaped every src', () => {
                const list = getAttribute('src');
                expect(list.length).toBe(0);
            });

            it('should have escaped every srcset', () => {
                const list = getAttribute('srcset');
                expect(list.length).toBe(0);
            });

            it('should have escaped every background', () => {
                const list = getAttribute('background');
                expect(list.length).toBe(0);
            });

            it('should have escaped every poster', () => {
                const list = getAttribute('poster');
                expect(list.length).toBe(0);
            });

            it('should have escaped every SVG', () => {
                const { querySelectorAll } = setup();
                const list = querySelectorAll('svg');
                expect(list.length).toBe(0);
            });
        });
    });

    describe('No escape inside URL', () => {
        it('should not escape the content of an anchor tag', () => {
            const { document } = setup(HTML_LINKS);
            expect(document.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('No escape TXT', () => {
        it('should not escape txt', () => {
            const { document } = setup(TEXT);
            expect(document.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('No escape EDGE_CASE', () => {
        it('should not escape EDGE_CASE', () => {
            const { document } = setup(EDGE_CASE);
            expect(document.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('No escape EDGE_CASE2', () => {
        it('should not escape EDGE_CASE', () => {
            const { document } = setup(EDGE_CASE_2);
            expect(document.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('No double escape', () => {
        it('should not double escape attributes', () => {
            const { document } = setup(DOM);
            expect(document.innerHTML).not.toMatch(/proton-proton-/);
        });
    });

    describe('Escape BACKGROUND_URL', () => {
        const getList = (content: string) => {
            const { querySelector } = setup(content);
            return (
                querySelector('body')
                    ?.innerHTML.split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean) || []
            );
        };

        it('should escape all', () => {
            const list = getList(BACKGROUND_URL);
            list.forEach((key) => expect(key).toMatch(/proton-/));
        });

        it('should escape all encoded url', () => {
            const list = getList(BACKGROUND_URL_ESCAPED);
            list.forEach((key) => expect(key).toMatch(/proton-/));
        });

        it('should escape encoded url with escape \\r', () => {
            const { document } = setup(BACKGROUND_URL_ESCAPED_WTF);
            expect(document.innerHTML).toMatch(/proton-/);
        });

        it('should escape encoded url with escape standard wtf', () => {
            const list = getList(BACKGROUND_URL_ESCAPED_WTF2);
            list.forEach((key) => expect(key).toMatch(/proton-/));
        });

        it('should escape octal and hex encoded urls with escape', () => {
            const list = getList(BACKGROUND_URL_OCTAL_HEX_ENCODING);
            list.forEach((key) => expect(key).toMatch(/proton-/));
        });

        it('should not break the HTML', () => {
            const { querySelector } = setup(EX_URL);
            expect(querySelector('body')?.innerHTML).toEqual(EX_URL_CLEAN);
        });
    });

    describe('base handling', () => {
        it('Should preserve <base href> in <head>', () => {
            const BASE = `<head><base href="https://bugzilla.mozilla.org/"></head>`;

            const { document, querySelector } = setup(BASE);
            expect(document.innerHTML).toMatch(/<base/);
            const base = querySelector('base');
            expect(base).toBeTruthy();
            expect(base?.getAttribute('href')).toEqual('https://bugzilla.mozilla.org/');
        });
    });

    describe('Not escape BACKGROUND_URL', () => {
        it('should not escape anything', () => {
            const { document } = setup(BACKGROUND_URL_SAFE);
            expect(document.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('Escape BACKGROUND_IMAGE_SET', () => {
        it('should escape image-set', () => {
            const { document } = setup(BACKGROUND_IMAGE_SET);
            expect(document.innerHTML).toMatch(/proton-/);
        });
    });

    describe('Escape BACKGROUND_DOUBLE_ESCAPING', () => {
        it('should escape double escaping', () => {
            const { document } = setup(BACKGROUND_DOUBLE_ESCAPING);
            expect(document.innerHTML).toMatch(/proton-url\(https/);
        });
    });

    describe('Escape form inputs', () => {
        describe('input attributes filtering', () => {
            it('should only allow permitted attributes on input elements', () => {
                const inputHtml = `
      <div>
        <input
          id="test-id"
          class="test-class"
          style="color: red;"
          value="test-value"
          readonly
          disabled
          type="text"
          name="test-name"
          placeholder="test-placeholder"
          autocomplete="off"
          required
          pattern="[A-Za-z]+"
          minlength="3"
          maxlength="10"
          min="1"
          max="100"
          step="10"
          onclick="alert('XSS')"
          onmouseover="alert('XSS')"
          formaction="javascript:alert('XSS')"
          data-custom="something"
        />
      </div>
    `;

                const { document } = setup(inputHtml);
                const inputElement = document.querySelector('input');

                // Test that the input element exists
                expect(inputElement).not.toBeNull();

                // Test allowed attributes are preserved
                expect(inputElement?.hasAttribute('id')).toBe(true);
                expect(inputElement?.hasAttribute('class')).toBe(true);
                expect(inputElement?.hasAttribute('style')).toBe(true);
                expect(inputElement?.hasAttribute('value')).toBe(true);
                expect(inputElement?.hasAttribute('readonly')).toBe(true);
                expect(inputElement?.hasAttribute('disabled')).toBe(true);
                expect(inputElement?.hasAttribute('type')).toBe(true);
                expect(inputElement?.hasAttribute('name')).toBe(true);

                // Test disallowed attributes are removed
                expect(inputElement?.hasAttribute('placeholder')).toBe(false);
                expect(inputElement?.hasAttribute('autocomplete')).toBe(false);
                expect(inputElement?.hasAttribute('required')).toBe(false);
                expect(inputElement?.hasAttribute('pattern')).toBe(false);
                expect(inputElement?.hasAttribute('minlength')).toBe(false);
                expect(inputElement?.hasAttribute('maxlength')).toBe(false);
                expect(inputElement?.hasAttribute('min')).toBe(false);
                expect(inputElement?.hasAttribute('max')).toBe(false);
                expect(inputElement?.hasAttribute('step')).toBe(false);
                expect(inputElement?.hasAttribute('onclick')).toBe(false);
                expect(inputElement?.hasAttribute('onmouseover')).toBe(false);
                expect(inputElement?.hasAttribute('formaction')).toBe(false);
                expect(inputElement?.hasAttribute('data-custom')).toBe(false);
            });

            it('should handle multiple input elements correctly', () => {
                const multipleInputsHtml = `
      <div>
        <input id="input1" onclick="alert('XSS')" class="test-class" />
        <input id="input2" onmouseover="alert('XSS')" value="test" />
        <input id="input3" formaction="javascript:alert('XSS')" disabled />
      </div>
    `;

                const { document } = setup(multipleInputsHtml);
                const inputs = document.querySelectorAll('input');

                expect(inputs.length).toBe(3);

                // Check first input
                expect(inputs[0].hasAttribute('id')).toBe(true);
                expect(inputs[0].hasAttribute('class')).toBe(true);
                expect(inputs[0].hasAttribute('onclick')).toBe(false);

                // Check second input
                expect(inputs[1].hasAttribute('id')).toBe(true);
                expect(inputs[1].hasAttribute('value')).toBe(true);
                expect(inputs[1].hasAttribute('onmouseover')).toBe(false);

                // Check third input
                expect(inputs[2].hasAttribute('id')).toBe(true);
                expect(inputs[2].hasAttribute('disabled')).toBe(true);
                expect(inputs[2].hasAttribute('formaction')).toBe(false);
            });

            it('should not affect other element types', () => {
                const mixedElementsHtml = `
      <div>
        <input id="test-input" onclick="alert('XSS')" />
        <button id="test-button" onclick="alert('XSS')">Click me</button>
        <a id="test-link" onclick="alert('XSS')" href="#">Link</a>
      </div>
    `;

                const { document } = setup(mixedElementsHtml);

                // Input should have onclick removed
                const input = document.querySelector('input');
                expect(input?.hasAttribute('onclick')).toBe(false);

                // Other elements should not be affected by input attribute filtering
                const button = document.querySelector('button');
                const link = document.querySelector('a');

                // Assert button and link exist
                expect(button).not.toBeNull();
                expect(link).not.toBeNull();
            });

            it('should handle inputs with no attributes correctly', () => {
                const plainInputHtml = `<div><input></div>`;

                const { document } = setup(plainInputHtml);
                const input = document.querySelector('input');

                expect(input).not.toBeNull();
                expect(input?.tagName).toBe('INPUT');
            });

            it('should only allow permitted attributes on textarea elements', () => {
                const textareaHtml = `
                  <div>
                    <textarea
                      id="test-id"
                      class="test-class"
                      style="color: red;"
                      value="test-value"
                      readonly
                      disabled
                      name="test-name"
                      placeholder="test-placeholder"
                      autocomplete="off"
                      required
                      minlength="3"
                      maxlength="10"
                      onclick="alert('XSS')"
                      onmouseover="alert('XSS')"
                      data-custom="something"
                    >Initial content</textarea>
                  </div>
                `;

                const { document } = setup(textareaHtml);
                const textareaElement = document.querySelector('textarea');

                expect(textareaElement).not.toBeNull();

                // Test allowed attributes are preserved
                expect(textareaElement?.hasAttribute('id')).toBe(true);
                expect(textareaElement?.hasAttribute('class')).toBe(true);
                expect(textareaElement?.hasAttribute('style')).toBe(true);
                expect(textareaElement?.hasAttribute('readonly')).toBe(true);
                expect(textareaElement?.hasAttribute('disabled')).toBe(true);
                expect(textareaElement?.hasAttribute('name')).toBe(true);

                // Test disallowed attributes are removed
                expect(textareaElement?.hasAttribute('placeholder')).toBe(false);
                expect(textareaElement?.hasAttribute('autocomplete')).toBe(false);
                expect(textareaElement?.hasAttribute('required')).toBe(false);
                expect(textareaElement?.hasAttribute('minlength')).toBe(false);
                expect(textareaElement?.hasAttribute('maxlength')).toBe(false);
                expect(textareaElement?.hasAttribute('onclick')).toBe(false);
                expect(textareaElement?.hasAttribute('onmouseover')).toBe(false);
                expect(textareaElement?.hasAttribute('data-custom')).toBe(false);

                // Test content is preserved
                expect(textareaElement?.textContent).toBe('Initial content');
            });
        });
    });
});
