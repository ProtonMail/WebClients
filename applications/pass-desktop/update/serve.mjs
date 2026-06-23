/* eslint-disable no-console */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const ssoCertDir = join(root, '..', '..', '..', 'utilities', 'local-sso');
const cert = join(ssoCertDir, '_wildcard.proton.dev.pem');
const key = join(ssoCertDir, '_wildcard.proton.dev-key.pem');
const forceHttp = process.argv.includes('--http');
const useHttps = !forceHttp && existsSync(cert) && existsSync(key);

const tls = useHttps ? `-S -C "${cert}" -K "${key}"` : '';
const command = `npx --yes http-server "${root}" -p 8099 -c-1 ${tls}`;

if (useHttps) {
    console.log('[update] HTTPS on https://download.proton.dev:8099 (reusing local-sso cert)');
    console.log('[update] Requires /etc/hosts: 127.0.0.1 download.proton.dev');
} else {
    console.log(
        '[update] HTTP on http://localhost:8099 — also reachable from a VM via the host IP. macOS install needs HTTPS (see README).'
    );
}

spawn(command, { stdio: 'inherit', shell: true });
