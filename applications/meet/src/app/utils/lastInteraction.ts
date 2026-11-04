let lastInteraction: 'keyboard' | 'pointer' = 'pointer';
let interactionCount = 0;

// Registered on module load, not on mount: the click or Enter that opens a panel lands before the
// panel's field mounts and focuses itself, and that field still has to know which one it was.
document.addEventListener(
    'keydown',
    (event) => {
        // Alt stays in: Safari moves focus with Option+Tab.
        if (event.metaKey || event.ctrlKey) {
            return;
        }

        lastInteraction = 'keyboard';
        interactionCount += 1;
    },
    { capture: true }
);

document.addEventListener(
    'pointerdown',
    () => {
        lastInteraction = 'pointer';
        interactionCount += 1;
    },
    { capture: true }
);

export const isLastInteractionKeyboard = () => lastInteraction === 'keyboard';

export const getInteractionCount = () => interactionCount;
