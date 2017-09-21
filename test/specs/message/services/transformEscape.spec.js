describe('transformEscape service', () => {

    let factory, getAttribute;
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


    let output;


    beforeEach(module('proton.message', 'proton.constants', 'proton.config', 'proton.commons', ($provide) => {

        $provide.factory('unsubscribeModel', () => ({
            init: angular.noop
        }));

    }));


    beforeEach(inject(($injector) => {
       factory = $injector.get('transformEscape');
    }));

    describe('Escape <pre>', () => {

        describe('No syntax hightlighting', () => {
            beforeEach(() => {
                output = factory(document.createElement('DIV'), null, {
                    content: CODE_HTML
                });
            });

            it('should escape inside a <code> tag', () => {
                expect(output.innerHTML).toBe(CODE_HTML_ESCAPED);
            });


            it('should not escape text inside a <code> tag', () => {
                const demo = factory(document.createElement('DIV'), null, {
                    content: CODE_TEXT
                });
                expect(demo.innerHTML).toBe(CODE_TEXT);
            });

        });

        describe('Syntax hightlighting', () => {
            beforeEach(() => {
                output = factory(document.createElement('DIV'), null, {
                    content: CODE_HTML_HIGHLIGHT
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
                content: DOM
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
                content: HTML_LINKS
            });
        });

        it('should not escape the content of an anchor tag', () => {
            expect(output.innerHTML).not.toMatch(/proton-/);
        });

    });
    describe('No escape TXT', () => {

        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: TEXT
            });
        });

        it('should not escape txt', () => {
            expect(output.innerHTML).not.toMatch(/proton-/);
        });

    });

    describe('No escape EDGE_CASE', () => {

        beforeEach(() => {
            output = factory(document.createElement('DIV'), null, {
                content: EDGE_CASE
            });
        });

        it('should not escape EDGE_CASE', () => {
            expect(output.innerHTML).not.toMatch(/proton-/);
        });

    });

});
