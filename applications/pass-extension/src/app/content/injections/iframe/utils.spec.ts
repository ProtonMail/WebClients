import { sanitizeIframeStyles } from './utils';

describe('`sanitizeIframeStyles`', () => {
    let iframe: HTMLIFrameElement;

    beforeEach(() => {
        iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
    });

    afterEach(() => {
        document.body.removeChild(iframe);
    });

    test('should handle empty style attribute', () => {
        sanitizeIframeStyles(iframe);
        expect(iframe.getAttribute('style')).toBe(null);
    });

    test('should remove all style properties', () => {
        iframe.style.opacity = '0.01';
        iframe.style.pointerEvents = 'none';
        iframe.style.transform = 'scale(5)';
        iframe.style.filter = 'opacity(1%)';
        iframe.style.setProperty('--unknown-var', 'value');

        sanitizeIframeStyles(iframe);

        expect(iframe.style.opacity).toBe('');
        expect(iframe.style.pointerEvents).toBe('');
        expect(iframe.style.transform).toBe('');
        expect(iframe.style.filter).toBe('');
        expect(iframe.style.getPropertyValue('--unknown-var')).toBe('');
    });

    test('should correctly parse and sanitize complex inline styles', () => {
        iframe.setAttribute(
            'style',
            'Position: absolute; TOP: 0; left:0;width:100%; height: 100vh;z-Index:9999; --theme-color: blue; --font-size: 16px;'
        );

        sanitizeIframeStyles(iframe);

        expect(iframe.style.position).toBe('');
        expect(iframe.style.top).toBe('');
        expect(iframe.style.left).toBe('');
        expect(iframe.style.width).toBe('');
        expect(iframe.style.height).toBe('');
        expect(iframe.style.zIndex).toBe('');
        expect(iframe.style.getPropertyValue('--theme-color')).toBe('');
        expect(iframe.style.getPropertyValue('--font-size')).toBe('');
    });

    test('should handle malformed style declarations', () => {
        iframe.setAttribute(
            'style',
            'position:absolute;;; color:red; :invalid; --valid-var: value; malformed; background-color: white'
        );

        sanitizeIframeStyles(iframe);

        expect(iframe.style.position).toBe('');
        expect(iframe.style.color).toBe('');
        expect(iframe.style.backgroundColor).toBe('');
        expect(iframe.style.getPropertyValue('--valid-var')).toBe('');
    });

    test('should preserve custom `--frame` CSS variables', () => {
        iframe.setAttribute(
            'style',
            '--frame-animation: fadein; --frame-width: 250px; --frame-height: 92px; --frame-top: 452.5px; --frame-left: 554px; --frame-right: unset;'
        );

        sanitizeIframeStyles(iframe);

        expect(iframe.style.getPropertyValue('--frame-animation')).toBe('fadein');
        expect(iframe.style.getPropertyValue('--frame-width')).toBe('250px');
        expect(iframe.style.getPropertyValue('--frame-height')).toBe('92px');
        expect(iframe.style.getPropertyValue('--frame-top')).toBe('452.5px');
        expect(iframe.style.getPropertyValue('--frame-left')).toBe('554px');
        expect(iframe.style.getPropertyValue('--frame-right')).toBe('unset');
    });
});
