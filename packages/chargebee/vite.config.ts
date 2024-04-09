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
            /**
             * Adds template for nonce that can be later replaced by the host of the HTML file.
             * Backend is supposed to return this file as-is with the exception of replacing "{nonce}"".
             */
            transformIndexHtml(html: string) {
                const scriptStartRegex = /<script(.*?)/gi;
                const nonce = '<script nonce="{nonce}"$1';

                return html.replace(scriptStartRegex, nonce);
            },
        },
        {
            /**
             * This allows to dynamically replace the JS script on the backend. It's helpful for debugging
             * in development, especially when the script is being served from a different domain.
             */
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
