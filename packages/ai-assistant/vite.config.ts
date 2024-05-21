import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
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
    ],
});
