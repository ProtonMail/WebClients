import Quill from 'quill';

const Embed = Quill.import('blots/embed');

// const ATTRIBUTES = ['alt', 'height', 'width', 'cid'];
const ATTRIBUTES = [
    {
        obj: 'alt',
        dom: 'alt'
    },
    {
        obj: 'cid',
        dom: 'data-embedded-img'
    }
];

class ProtonImage extends Embed {
    static create(value: string) {
        // console.log('ProtonImage.create', value);
        const node = super.create(value);
        if (typeof value === 'string') {
            node.setAttribute('src', value);
        }
        node.classList.add('proton-embedded');
        return node;
    }

    static formats(domNode: Element) {
        // console.log('ProtonImage.formats', domNode);
        return ATTRIBUTES.reduce((formats, attribute) => {
            if (domNode.hasAttribute(attribute.dom)) {
                formats[attribute.obj] = domNode.getAttribute(attribute.dom);
            }
            return formats;
        }, {} as { [key: string]: any });
    }

    static match(url: string) {
        // console.log('ProtonImage.match', url);
        return /\.(jpe?g|gif|png)$/.test(url) || /^data:image\/.+;base64/.test(url);
    }

    static register() {
        // console.log('ProtonImage.register');
        if (/Firefox/i.test(navigator.userAgent)) {
            setTimeout(() => {
                // Disable image resizing in Firefox
                document.execCommand('enableObjectResizing', false);
            }, 1);
        }
    }

    static value(domNode: Element) {
        // console.log('ProtonImage.value', domNode);
        return domNode.getAttribute('src');
    }

    format(name: string, value: string) {
        // console.log('ProtonImage.format', name, value);
        const attribute = ATTRIBUTES.find((attribute) => attribute.obj === name);
        if (attribute) {
            if (value) {
                this.domNode.setAttribute(attribute.dom, value);
            } else {
                this.domNode.removeAttribute(attribute.dom);
            }
        } else {
            super.format(name, value);
        }
    }
}

ProtonImage.blotName = 'image';
ProtonImage.tagName = 'IMG';

export default ProtonImage;
