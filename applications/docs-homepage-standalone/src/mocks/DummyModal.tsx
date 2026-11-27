import { useState } from 'react';

// Opened as a modal dialog, so the browser shows it above the page, with a backdrop, and closes it on Escape.
function DummyModal({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <dialog
            ref={(dialog) => {
                if (dialog && !dialog.open) {
                    dialog.showModal();
                }
            }}
            aria-label={title}
            onClose={onClose}
            style={{ padding: 16 }}
        >
            <h2>{title}</h2>
            <button type="button" onClick={onClose}>
                Close
            </button>
        </dialog>
    );
}

/**
 * Stands in for the Docs app's share and move modals, which come from Drive: `showDummyModal(title)` shows which one
 * the homepage opened, in `dummyModal`, which the caller renders.
 */
export function useDummyModal() {
    const [title, setTitle] = useState<string>();

    const dummyModal = title && <DummyModal title={title} onClose={() => setTitle(undefined)} />;
    return { dummyModal, showDummyModal: setTitle };
}
