import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
    resolve: {
        alias: [
            {
                // this is required for the SCSS modules
                find: /^~(.*)$/,
                replacement: '$1',
            },
        ],
    },
    plugins: [
        mkcert(),
        viteSingleFile(),
        {
            name: 'html-inject-nonce-into-script-tag',
            enforce: 'post',
            transformIndexHtml(html: string) {
                const scriptStartRegex = /<script(.*?)/gi;
                const nonce = '<script nonce="{nonce}"$1';

                return html.replace(scriptStartRegex, nonce);
            },
        },
        {
            name: 'html-replace-chargebee-js-src',
            enforce: 'post',
            transformIndexHtml(html: string) {
                if (process.env.NODE_ENV !== 'production') {
                    return html;
                }

                const srcRegex = /src="(.*?chargebee.*?)"/gi;
                const chargebeeTemplate = 'src="{chargebee_js_src}"';

                return html.replace(srcRegex, chargebeeTemplate);
            },
        },
    ],
});
