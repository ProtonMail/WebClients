fdescribe('transformEscape service', () => {

    let factory;
    const URL_PROTON = 'https://protonmail.com';
    const URL_PROTON_SLASH = 'https://protonmail.com/';

    const LINKS = {
        'xlink:href': ['firefox.jpg', 'chrome.jpg' ],
        svg: null,
        src: ['mon-image.jpg', 'lol-image.jpg', 'fichiervideo.webm'],
        srcset: ['mon-imageHD.jpg 2x', 'lol-imageHD.jpg 2x'],
        poster: ['vignette2.jpg'],
        style: 'https://i.imgur.com/WScAnHr.jpg'


    };
    const DOM = `<section>
    <svg width="5cm" height="4cm" version="1.1"
         xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink">
        <image xlink:href="firefox.jpg" x="0" y="0" height="50px" width="50px" />
        <image xlink:href="chrome.jpg" x="0" y="0" height="50px" width="50px" />
    </svg>
    <video src="fichiervideo.webm" autoplay poster="vignette.jpg">
    </video>

    <video src="fichiervideo.webm" autoplay poster="vignette2.jpg">
    </video>
    <img src="mon-image.jpg" srcset="mon-imageHD.jpg 2x" width="" height="" alt="">
    <img src="lol-image.jpg" srcset="lol-imageHD.jpg 2x" width="" height="" alt="">

    <style>
        body {background: 'https://i.imgur.com/WScAnHr.jpg'}
        div {background: 'https://i.imgur.com/WScAnHr.jpg'}
    </style>
</section>`;

    const CODE_HTML_HIGHLIGHT = `
    <div style="box-sizing: border-box;white-space: normal;" class="pre"><div style="box-sizing: border-box;color: #fff;max-width: 100%;font-size: 16px;line-height: 1.3;" class="code"><span style="box-sizing: border-box;color: #DDDDDF;" class="nt">&lt;script</span> <span style="box-sizing: border-box;color: #84868B;" class="na">src="</span><span style="box-sizing: border-box;color: #68BEA2;" class="s"><span class="s">https<span>://</span>use.fontawesome<span>.</span>com/f0d8991ea9.js</span><span style="box-sizing: border-box;color: #84868B;" class="na">"</span><span style="box-sizing: border-box;color: #DDDDDF;" class="nt">&gt;</span><span style="box-sizing: border-box;color: #DDDDDF;" class="nt">&lt;/script&gt;</span></span></div></div>
`;
    const CODE_HTML = `<pre><code><img src="polo.fr"></code></pre>`;

    let output;

    beforeEach(module('proton.message', 'proton.constants', 'proton.config', 'proton.commons'));

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

            it('should not escape inside a <code> tag', () => {
                expect(output.innerHTML).toBe(CODE_HTML);
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

});
