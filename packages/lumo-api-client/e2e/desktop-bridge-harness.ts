/**
 * Driver page for the desktop bridge E2E test. Imports the real desktop-tools module
 * and exposes each flow through the DOM contract that the WebdriverIO specs in
 * lumo-desktop read
 */
import {
    createDesktopClientToolExecutor,
    getDesktopOpenAITools,
    getPendingToolApprovals,
    initDesktopToolApprovals,
    resolveToolApproval,
    subscribeToolApprovals,
} from '../core/desktop-tools';

function node(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`desktop-bridge-harness: missing DOM contract node #${id}`);
    }
    return element;
}

function set(id: string, value: string): void {
    node(id).textContent = value;
}

function report(reason: string, detail: unknown): void {
    const message = detail instanceof Error ? `${detail.message}\n${detail.stack ?? ''}` : String(detail);
    node('error').textContent += `${reason}: ${message}\n`;
}

window.addEventListener('error', (event) => report('error', event.error ?? event.message));
window.addEventListener('unhandledrejection', (event) => report('unhandledrejection', event.reason));

const executor = createDesktopClientToolExecutor();

async function run(callId: string, name: string, args = '{}'): Promise<void> {
    set('result', '');
    const results = await executor.execute([{ id: callId, name, arguments: args }]);
    set('result', JSON.stringify(results));
}

function input(id: string): HTMLInputElement {
    const element = node(id);
    if (!(element instanceof HTMLInputElement)) {
        throw new Error(`desktop-bridge-harness: #${id} is not an input`);
    }
    return element;
}

function firstPendingId(): string {
    return node('pending-id').textContent ?? '';
}

async function main(): Promise<void> {
    initDesktopToolApprovals();

    subscribeToolApprovals(() => {
        const pending = getPendingToolApprovals();
        set('pending', String(pending.length));
        set('pending-id', pending[0]?.requestId ?? '');
    });
    set('pending', '0');

    const tools = await getDesktopOpenAITools();
    set('tools', tools.map((tool) => tool.function.name).join(','));

    node('run').addEventListener('click', () => {
        const name = input('tool-name').value.trim();
        const args = input('tool-args').value.trim() || '{}';
        void run('e2e-run', name, args).catch((error) => report(`run ${name}`, error));
    });
    node('approve').addEventListener('click', () => resolveToolApproval(firstPendingId(), true));
    node('deny').addEventListener('click', () => resolveToolApproval(firstPendingId(), false));

    set('ready', '1');
}

void main().catch((error) => report('main', error));
