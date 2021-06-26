import { transformBase } from '../transformBase';

describe('transformBase service', () => {
    const URL_PROTON = 'https://protonmail.com';
    const URL_PROTON_SLASH = 'https://protonmail.com/';

    const LINKS = {
        linkRelative: '/monique',
        linkRelative2: '/robert',
        linkRelative3: 'roberts',
        imgRelative: '/monique.jpg',
        imgRelative2: '/robert.jpg',
        imgRelative3: 'robert3.jpg',
        linkAbsolutehttp: 'http://cpp.li/monique',
        linkAbsolutehttps: 'https://cpp.li/monique2',
        imgAbsolute: 'http://cpp.li/robert3.jpg',
        imgAbsolute2: 'https://cpp.li/robert3.jpg',
        imgCID: 'cid:xxxxx',
        imghttp: 'https://cpp.li/robert3.jpg',
        ahttp: 'https://cpp.li/',
    };
    const DOM = `
        <section>
            <a href="${LINKS.linkRelative}" id="linkRelative" class="link-relative">Monique</a>
            <a href="${LINKS.linkRelative2}" id="linkRelative2" class="link-relative">Robert</a>
            <a href="${LINKS.linkRelative3}" id="linkRelative3" class="link-relative">Roberts</a>
            <a href="${LINKS.linkAbsolutehttp}" id="linkAbsolutehttp" class="link-absolute">Monique</a>
            <a href="${LINKS.linkAbsolutehttps}" id="linkAbsolutehttps" class="link-absolute">Monique</a>
            <a class="link-empty" id="linkNope">Nope</a>
            <img src="${LINKS.imgRelative}" id="imgRelative" class="img-relative">
            <img src="${LINKS.imgRelative2}" id="imgRelative2" class="img-relative">
            <img src="${LINKS.imgRelative3}" id="imgRelative3" class="img-relative">
            <img src="${LINKS.imgAbsolute}" id="imgAbsolute" class="img-absolute">
            <img src="${LINKS.imgAbsolute2}" id="imgAbsolute2" class="img-absolute">
            <img class="img-empty" id="imgNope">
            <img proton-src="${LINKS.imgCID}" alt="" id="imgcid" />
            <img src="${LINKS.imghttp}" alt="" id="imghttp" />
            <a href="${LINKS.ahttp}"  id="ahttp">dew</a>
        </section
    `;
    const DEFAULT_DOMAIN = 'http://lol.com';

    const setup = (path = DEFAULT_DOMAIN) => {
        const doc = document.implementation.createHTMLDocument('test transformBase');
        const base = document.createElement('BASE') as HTMLBaseElement;
        base.href = path;
        doc.head.appendChild(base);
        doc.body.innerHTML = DOM;

        transformBase(doc as any);

        const querySelector = (selectors: string) => doc.querySelector(selectors);
        const querySelectorAll = (selectors: string) => [...doc.querySelectorAll(selectors)];

        return { document: doc, querySelector, querySelectorAll };
    };

    describe('Escape base relative no slash', () => {
        describe('For a link', () => {
            const getLinks = (type = 'relative') => {
                const { querySelectorAll } = setup(URL_PROTON);
                return querySelectorAll(`.link-${type}`).map((element) => (element as HTMLLinkElement).href);
            };

            it('should prepend the base into href', () => {
                const [link1, link2, link3] = getLinks();
                expect(link1).toContain(URL_PROTON);
                expect(link2).toContain(URL_PROTON);
                expect(link3).toContain(URL_PROTON);
            });

            it('should prepend the base into href without breaking the path', () => {
                const [link1, link2] = getLinks();
                expect(link1).toBe(URL_PROTON + LINKS.linkRelative);
                expect(link2).toBe(URL_PROTON + LINKS.linkRelative2);
            });

            it('should prepend the base into href with a slash', () => {
                const [, , link3] = getLinks();
                expect(link3).toBe(`${URL_PROTON}/${LINKS.linkRelative3}`);
            });

            it('should bind a href if there is not', () => {
                const { querySelector } = setup(URL_PROTON);
                const nope = querySelector('#linkNope') as HTMLLinkElement;
                expect(nope.href).toBe(`${URL_PROTON}/`);
            });

            it('should not change the HREF for a link with already http', () => {
                const { querySelector } = setup(URL_PROTON);
                const nope = querySelector('#ahttp') as HTMLLinkElement;
                expect(nope.href).toBe(LINKS.ahttp);
            });
        });

        describe('For an image', () => {
            const getImages = (type = 'relative') => {
                const { querySelectorAll } = setup(URL_PROTON);
                return querySelectorAll(`.img-${type}`).map((element) => (element as HTMLImageElement).src);
            };

            it('should prepend the base into href', () => {
                const [img1, img2, img3] = getImages();
                expect(img1).toContain(URL_PROTON);
                expect(img2).toContain(URL_PROTON);
                expect(img3).toContain(URL_PROTON);
            });

            it('should prepend the base into src without breaking the path', () => {
                const [img1, img2] = getImages();
                expect(img1).toBe(URL_PROTON + LINKS.imgRelative);
                expect(img2).toBe(URL_PROTON + LINKS.imgRelative2);
            });

            it('should prepend the base into src with a slash', () => {
                const [, , img3] = getImages();
                expect(img3).toBe(`${URL_PROTON}/${LINKS.imgRelative3}`);
            });

            it('should bind proton-src if there is not', () => {
                const { querySelector } = setup(URL_PROTON);
                const nope = querySelector('#imgNope') as HTMLImageElement;
                expect(nope.getAttribute('proton-src')).toBe(`${URL_PROTON}/`);
                expect(nope.src).toBe('');
            });

            it('should not change the SRC for a link with already http', () => {
                const { querySelector } = setup(URL_PROTON);
                const nope = querySelector('#imghttp') as HTMLImageElement;
                expect(nope.src).toBe(LINKS.imghttp);
            });

            it('should not change the SRC for a link with cid', () => {
                const { querySelector } = setup(URL_PROTON);
                const nope = querySelector('#imgcid') as HTMLImageElement;
                expect(nope.getAttribute('proton-src')).toBe(LINKS.imgCID);
                expect(nope.getAttribute('src')).toBe(null);
            });
        });
    });

    describe('Escape base relative slash', () => {
        describe('For a link', () => {
            const getLinks = (type = 'relative') => {
                const { querySelectorAll } = setup(URL_PROTON_SLASH);
                return querySelectorAll(`.link-${type}`).map((element) => (element as HTMLLinkElement).href);
            };

            it('should prepend the base into href', () => {
                const [link1, link2, link3] = getLinks();
                expect(link1).toContain(URL_PROTON_SLASH);
                expect(link2).toContain(URL_PROTON_SLASH);
                expect(link3).toContain(URL_PROTON_SLASH);
            });

            it('should prepend the base into href without breaking the path', () => {
                const [link1, link2] = getLinks();
                expect(link1).toBe(URL_PROTON + LINKS.linkRelative);
                expect(link2).toBe(URL_PROTON + LINKS.linkRelative2);
            });

            it('should prepend the base into href with a slash', () => {
                const [, , link3] = getLinks();
                expect(link3).toBe(URL_PROTON_SLASH + LINKS.linkRelative3);
            });

            it('should bind a href if there is not', () => {
                const { querySelector } = setup(URL_PROTON_SLASH);
                const nope = querySelector('#linkNope') as HTMLLinkElement;
                expect(nope.href).toBe(URL_PROTON_SLASH);
            });

            it('should not change the HREF for a link with already http', () => {
                const { querySelector } = setup(URL_PROTON_SLASH);
                const nope = querySelector('#ahttp') as HTMLLinkElement;
                expect(nope.href).toBe(LINKS.ahttp);
            });
        });

        describe('For an image', () => {
            const getImages = (type = 'relative') => {
                const { querySelectorAll } = setup(URL_PROTON_SLASH);
                return querySelectorAll(`.img-${type}`).map((element) => (element as HTMLImageElement).src);
            };

            it('should prepend the base into href', () => {
                const [img1, img2, img3] = getImages();
                expect(img1).toContain(URL_PROTON_SLASH);
                expect(img2).toContain(URL_PROTON_SLASH);
                expect(img3).toContain(URL_PROTON_SLASH);
            });

            it('should prepend the base into src without breaking the path', () => {
                const [img1, img2] = getImages();
                expect(img1).toBe(URL_PROTON + LINKS.imgRelative);
                expect(img2).toBe(URL_PROTON + LINKS.imgRelative2);
            });

            it('should prepend the base into src with a slash', () => {
                const [, , img3] = getImages();
                expect(img3).toBe(URL_PROTON_SLASH + LINKS.imgRelative3);
            });

            it('should bind proton-src if there is not', () => {
                const { querySelector } = setup(URL_PROTON_SLASH);
                const nope = querySelector('#imgNope') as HTMLImageElement;
                expect(nope.getAttribute('proton-src')).toBe(URL_PROTON_SLASH);
                expect(nope.src).toBe('');
            });

            it('should not change the SRC for a link with already http', () => {
                const { querySelector } = setup(URL_PROTON_SLASH);
                const nope = querySelector('#imghttp') as HTMLImageElement;
                expect(nope.src).toBe(LINKS.imghttp);
            });

            it('should not change the SRC for a link with cid', () => {
                const { querySelector } = setup(URL_PROTON_SLASH);
                const nope = querySelector('#imgcid') as HTMLImageElement;
                expect(nope.getAttribute('proton-src')).toBe(LINKS.imgCID);
                expect(nope.getAttribute('src')).toBe(null);
            });
        });
    });

    describe('Escape with a base', () => {
        const matchLink = (url: string, domain = DEFAULT_DOMAIN) => `${domain}${url.startsWith('/') ? url : `/${url}`}`;

        describe('For a link', () => {
            const getLinks = (type = 'relative') => {
                const { querySelectorAll } = setup();
                return querySelectorAll(`.link-${type}`).map((element) => (element as HTMLLinkElement).href);
            };

            it('should prepend the base into href', () => {
                const [link1, link2, link3] = getLinks();
                expect(link1).not.toContain(URL_PROTON);
                expect(link2).not.toContain(URL_PROTON);
                expect(link3).not.toContain(URL_PROTON);
            });

            it('should prepend the base into href without breaking the path', () => {
                const [link1, link2] = getLinks();
                expect(link1).toBe(matchLink(LINKS.linkRelative));
                expect(link2).toBe(matchLink(LINKS.linkRelative2));
            });

            it('should prepend the base into href with a slash', () => {
                const [, , link3] = getLinks();
                expect(link3).toBe(matchLink(LINKS.linkRelative3));
            });

            it('should bind a href if there is not', () => {
                const { querySelector } = setup();
                const nope = querySelector('#linkNope') as HTMLLinkElement;
                expect(nope.href).toBe(matchLink(''));
            });

            it('should not change the HREF for a link with already http', () => {
                const { querySelector } = setup();
                const nope = querySelector('#ahttp') as HTMLLinkElement;
                expect(nope.href).toBe(LINKS.ahttp);
            });
        });

        describe('For an image', () => {
            const getImages = (type = 'relative') => {
                const { querySelectorAll } = setup();
                return querySelectorAll(`.img-${type}`).map((element) => (element as HTMLImageElement).src);
            };

            it('should prepend the base into href', () => {
                const [img1, img2, img3] = getImages();
                expect(img1).not.toContain(URL_PROTON_SLASH);
                expect(img2).not.toContain(URL_PROTON_SLASH);
                expect(img3).not.toContain(URL_PROTON_SLASH);
            });

            it('should prepend the base into src without breaking the path', () => {
                const [img1, img2] = getImages();
                expect(img1).toBe(matchLink(LINKS.imgRelative));
                expect(img2).toBe(matchLink(LINKS.imgRelative2));
            });

            it('should prepend the base into src with a slash', () => {
                const [, , img3] = getImages();
                expect(img3).toBe(matchLink(LINKS.imgRelative3));
            });

            it('should bind proton-src if there is not', () => {
                const { querySelector } = setup();
                const nope = querySelector('#imgNope') as HTMLImageElement;
                expect(nope.getAttribute('proton-src')).toBe(matchLink(''));
                expect(nope.src).toBe('');
            });

            it('should not change the SRC for a link with already http', () => {
                const { querySelector } = setup();
                const nope = querySelector('#imghttp') as HTMLImageElement;
                expect(nope.src).toBe(LINKS.imghttp);
            });

            it('should not change the SRC for a link with cid', () => {
                const { querySelector } = setup();
                const nope = querySelector('#imgcid') as HTMLImageElement;
                expect(nope.getAttribute('proton-src')).toBe(LINKS.imgCID);
                expect(nope.getAttribute('src')).toBe(null);
            });
        });
    });
});
