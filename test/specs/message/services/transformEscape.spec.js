import service from '../../../../src/app/message/services/transformEscape';

describe('transformEscape service', () => {
    let getAttribute;
    const factory = service();
    const USER_INJECT = 'user.inject';
    const DOM = `<section>
    <svg width="5cm" height="4cm" version="1.1"
         xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink">
        <image xlink:href="firefox.jpg" x="0" y="0" height="50px" width="50px" />
        <image xlink:href="chrome.jpg" x="0" y="0" height="50px" width="50px" />
    </svg>
    <video src="fichiervideo.webm" autoplay poster="vignette.jpg">
    </video>
    <div>
        <img border="0" usemap="#fp"  src="cats.jpg ">
        <map name="fp">
            <area coords="0,0,800,800" href="proton_exploit.html" shape="rect" target="_blank" >
        </map>
    </div>

    <video src="fichiervideo.webm" autoplay poster="vignette2.jpg">
    </video>
    <img src="mon-image.jpg" srcset="mon-imageHD.jpg 2x" width="" height="" alt="">
    <img src="lol-image.jpg" srcset="lol-imageHD.jpg 2x" width="" height="" alt="">
    <a href="lol-image.jpg">Alll</a>
    <a href="jeanne-image.jpg">Alll</a>
    <div background="jeanne-image.jpg">Alll</div>
    <div background="jeanne-image2.jpg">Alll</div>
</section>`;

    const CODE_HTML_HIGHLIGHT = `
    <div style="box-sizing: border-box;white-space: normal;" class="pre"><div style="box-sizing: border-box;color: #fff;max-width: 100%;font-size: 16px;line-height: 1.3;" class="code"><span style="box-sizing: border-box;color: #DDDDDF;" class="nt">&lt;script</span> <span style="box-sizing: border-box;color: #84868B;" class="na">src="</span><span style="box-sizing: border-box;color: #68BEA2;" class="s"><span class="s">https<span>://</span>use.fontawesome<span>.</span>com/f0d8991ea9.js</span><span style="box-sizing: border-box;color: #84868B;" class="na">"</span><span style="box-sizing: border-box;color: #DDDDDF;" class="nt">&gt;</span><span style="box-sizing: border-box;color: #DDDDDF;" class="nt">&lt;/script&gt;</span></span></div></div><div class="pre"></div>
`;
    const HTML_LINKS = `<div>
  <a href="http://www.dewdwesrcset-dewdw.com/?srcset=de&srcset=Dewdwe"></a>
  <a href="http://www.dewdwesrc-dewdw.com/?src=de&src=Dewdwe"></a>
  <a href="http://www.dewdwebackground-dewdw.com/?background=de&background=Dewdwe"></a>
  <a href="http://www.dewdweposter-dewdw.com/?poster=de&poster=Dewdwe"></a>
  <a href="http://www.google.nl/?url=a"></a>
  <a href="http://www.google.nl/?src=a&srcset=dew"></a>
</div>`;
    const CODE_HTML = `<pre><code><img src="polo.fr"></code></pre>`;
    const CODE_HTML_ESCAPED = `<pre><code><img proton-src="polo.fr"></code></pre>`;
    const CODE_TEXT = `<pre><code>{ background: url('monique.jpg') }</code></pre>`;
    const TEXT = `<p>salut monique est ceque tu as un src="lol" dans la poche ?</p><span>src=</span>`;
    const EDGE_CASE = `<div id="ymail_android_signature"><a href="https://overview.mail.yahoo.com/mobile/?.src=Android">Sent from Yahoo Mail on Android</a></div>`;
    const EDGE_CASE_2 = `
        webEngineView->setUrl("
        <span>webEngineView->setUrl("</span>
        <div>webEngineView->setUrl("</div>
        <pre>webEngineView->setUrl("</pre>
        <code>webEngineView->setUrl(".</code>`;

    const EX_URL = `<div style="background: url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>`;
    const EX_URL_CLEAN = `<div style="background: proton-url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>`;
    const BACKGROUND_URL = `
        <div style="background: url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>
        <div style="color: red; background: #ffffff url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>
        <div style="color: red; background:    url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>
        <div style="color: red; background:url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</div>
        <span style="color: red; background:url('https://i.imgur.com/WScAnHr.jpg')">ddewdwed</span>`;
    const BACKGROUND_URL_ESCAPED_WTF =
        '<div style="width: 500px; height: 500px; background:u\\rl(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>';

    // DON'T REMOVE THEM
    const BACKGROUND_URL_ESCAPED_WTF2 = `
        <div style="width: 500px; height: 500px; background:ur\l(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
        <div style="width: 500px; height: 500px; background:u\&#114;l(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
        <div style="width: 500px; height: 500px; background:ur\&#108;(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
    `;
    const BACKGROUND_URL_ESCAPED = `
        <div style="width: 500px; height: 500px; background:&#117;rl(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
        <div style="width: 500px; height: 500px; background:&#117;rl(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)">ddewdwed</div>
        <div style="width: 500px; height: 500px; background:&#117;rl(&apos;https://i.imgur.com/WScAnHr.jpg&apos;)">ddewdwed</div>
        <div style="width: 500px; height: 500px; content: &quot; ass &quot;; background:url(https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="width: 500px; height: 500px; content: &quot; ass &quot;; background:url(https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="width: 500px; height: 120px; content: &quot; ass &quot;; background:&#117;&#114;&#108;(https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="width: 500px; height: 120px; content: &quot; ass &quot;; background:&#117;r&#108;(https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="width: 500px; height: 500px; content: &quot; ass &quot;; background:url&#x00028;https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="width: 500px; height: 500px; content: &quot; ass &quot;; background:url&lpar;https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        <div style="width: 500px; height: 456px; content: &quot; ass &quot;; background:url&#40;https://i.imgur.com/WScAnHr.jpg);">ddewdwed</div>
        `;
    const BACKGROUND_URL_SAFE = `
        <span>url('dewd')</span>
        <span>style="dewdw" url('dewd')</span>
        <span>dew style="dewdw" url('dewd')</span>
        <span>dew style="dewdw": url(</span>
        <span>dew style="content: \\"a\\"": url(</span>
        <span>dew style="content: 'a": url(</span>
        <span>dew style="content: \\"a": url(</span>
        <div style="width: 500px; height: 500px; content: &quot; background:url(test)&quot;">ddewdwed</div>
        <div style="width: 500px; height: 500px; content: &apos; background:url(test)&apos;">ddewdwed</div>`;

    let output;

    describe('Escape <pre>', () => {
        describe('No syntax hightlighting', () => {
            beforeEach(() => {
                output = factory(document.createElement('DIV'), null, {
                    content: CODE_HTML,
                });
            });

            it('should escape inside a <code> tag', () => {
                expect(output.innerHTML).toBe(CODE_HTML_ESCAPED);
            });

            it('should not escape text inside a <code> tag', () => {
                const demo = factory(document.createElement('DIV'), null, {
                    content: CODE_TEXT,
                });
                expect(demo.innerHTML).toBe(CODE_TEXT);
            });
        });

        describe('Syntax hightlighting', () => {
            beforeEach(() => {
                output = factory(document.createElement('DIV'), null, {
                    content: CODE_HTML_HIGHLIGHT,
                });
            });

            it('should not escape inside a <code> tag', () => {
                expect(output.innerHTML).not.toMatch(/proton-/);
            });
        });
    });

    describe('Escape everything with proton-', () => {
        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: DOM,
            });
            getAttribute = (attribute) => {
                return [].slice.call(output.querySelectorAll(`[${attribute}]`));
            };
        });

        describe('Add a prefix', () => {
            it('should not add the prefix before href', () => {
                const list = getAttribute('proton-href');
                expect(list.length).toBe(0);
            });

            it('should add the prefix before src', () => {
                const list = getAttribute('proton-src');
                expect(list.length).toBe(5);
            });

            it('should add the prefix before srcset', () => {
                const list = getAttribute('proton-srcset');
                expect(list.length).toBe(2);
            });

            it('should add the prefix before background', () => {
                const list = getAttribute('proton-background');
                expect(list.length).toBe(2);
            });

            it('should add the prefix before poster', () => {
                const list = getAttribute('proton-poster');
                expect(list.length).toBe(2);
            });

            it('should add the prefix for SVG', () => {
                const list = output.querySelectorAll('proton-svg');
                expect(list.length).toBe(1);
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
                const list = output.querySelectorAll('svg');
                expect(list.length).toBe(0);
            });
        });

        it('should correctly escape svg', () => {
            expect(output.innerHTML).toMatch(/\/proton-svg>/);
            expect(output.innerHTML).toMatch(/<proton-svg/);
        });
    });

    describe('No escape inside URL', () => {
        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: HTML_LINKS,
            });
        });

        it('should not escape the content of an anchor tag', () => {
            expect(output.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('No escape TXT', () => {
        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: TEXT,
            });
        });

        it('should not escape txt', () => {
            expect(output.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('No escape EDGE_CASE', () => {
        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: EDGE_CASE,
            });
        });

        it('should not escape EDGE_CASE', () => {
            expect(output.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('No escape EDGE_CASE2', () => {
        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: EDGE_CASE_2
            });
        });

        it('should not escape EDGE_CASE', () => {
            expect(output.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('No double escape', () => {
        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: DOM
            });
            output = factory(document.createElement('DIV'), null, {
                content: output.innerHTML
            });
        });

        it('should not double escape attributes', () => {
            expect(output.innerHTML).not.toMatch(/proton-proton-/);
        });
    });

    describe('Escape BACKGROUND_URL', () => {
        const getList = (input) => {
            return input.innerHTML
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
        };

        it('should escape all', () => {
            const html = factory(document.createElement('DIV'), null, {
                content: BACKGROUND_URL
            });
            const list = getList(html);

            list.forEach((key) => {
                expect(key).toMatch(/proton-/);
            });
        });

        it('should escape all encoded url', () => {
            const html = factory(document.createElement('DIV'), null, {
                content: BACKGROUND_URL_ESCAPED
            });
            const list = getList(html);

            list.forEach((key) => {
                expect(key).toMatch(/proton-/);
            });
        });
        it('should escape encoded url with escape \\r', () => {
            const html = factory(document.createElement('DIV'), null, {
                content: BACKGROUND_URL_ESCAPED_WTF
            });
            expect(html.innerHTML).toMatch(/proton-/);
        });

        it('should escape encoded url with escape standard wtf', () => {
            const html = factory(document.createElement('DIV'), null, {
                content: BACKGROUND_URL_ESCAPED_WTF2
            });
            const list = getList(html);

            list.forEach((key) => {
                expect(key).toMatch(/proton-/);
            });
        });

        it('should not break the HTML', () => {
            const html = factory(document.createElement('DIV'), null, {
                content: EX_URL
            });
            expect(html.innerHTML).toEqual(EX_URL_CLEAN);
        });
    });

    describe('no scape BACKGROUND_URL -> user.inject', () => {
        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: BACKGROUND_URL,
                action: USER_INJECT,
            });
        });

        it('should not escape anything', () => {
            expect(output.innerHTML).not.toMatch(/proton-/);
        });

        it('should not break the HTML', () => {
            const html = factory(document.createElement('DIV'), null, {
                content: EX_URL,
                action: USER_INJECT,
            });
            expect(html.innerHTML).not.toMatch(/proton-/);
        });
    });

    describe('Ǹot escape BACKGROUND_URL', () => {
        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: BACKGROUND_URL_SAFE
            });
        });

        it('should not escape anything', () => {
            expect(output.BACKGROUND_URL_SAFE).not.toMatch(/proton-/);
        });
    });
});
