# Location Move Engine

The Location Move Engine is a rule-based system that validates whether messages can be moved to specific labels or folders in Proton Mail. It enforces business logic to prevent invalid operations like moving sent messages to drafts or moving messages to labels they already have.

## Architecture

Two hooks can be used, one handles the rule for the `Conversation` where the other do it for the `Message`.

They are built for the `useApplyLocation` as a way to ensure a move is allowed and returning as early as possible. They _could_ be used elsewhere but this is outside of their intended purpose.

### Core Components

- **`MoveEngine`**: The main engine class that manages rules and validates moves
- **`moveEngineRulesConversations`**: Collection of all the conversations rules
- **`useConversationMoveEngine`**: Hook that creates and configures the move engine with all the rules for the conversations
- **`moveEngineRulesMessages`**: Collection of all the messages rules
- **`useMessageMoveEngine`**: Hook that creates and configures the move engine with all rules for the messages

### Rule System

Each rule has its own validation rule that determines:

- **ALLOW**: The move is permitted
- **DENY**: The move is not allowed
- **NOT_APPLICABLE**: No action needed as the move doesn't change anything

### Engine return values

The move engine's `validateMove` method returns a `MoveEngineCanMoveResult` object with the following properties:

```typescript
interface MoveEngineCanMoveResult {
    allowedElements: Element[]; // Elements that can be moved
    deniedElements: Element[]; // Elements that cannot be moved (will trigger error notification)
    notApplicableElements: Element[]; // Elements where the move has no effect
    errors: MoveEngineError[]; // Detailed error information for each problematic element
}
```

Each error in the `errors` array contains:

- `id`: The element ID
- `error`: The rule result (`DENIED` or `NOT_APPLICABLE`)

## Usage

**Do NOT use the MoveEngine class directly.** Always use the provided hooks:

```typescript
// ❌ Wrong - Don't do this
import { MoveEngine } from './MoveEngine';
// ✅ Correct - Use the hook
import { useMessageMoveEngine } from './useMessageMoveEngine';

const moveEngine = useMessageMoveEngine();
```

### Example: Using the Move Engine

Here's how the `useApplyLocation` hook uses the move engine:

```typescript
import { useMessageMoveEngine } from './useMessageMoveEngine';

export const useApplyLocation = () => {
    const moveEngine = useMessageMoveEngine();

    const applyLocation = ({ elements, targetLabelID, removeLabel = false }) => {
        // Validate the move operation
        const result = moveEngine.validateMove(targetLabelID, elements);

        // Handle error - show notification to user if all elements are denied
        if (result.deniedElements.length > 0 && result.allowedElements.length === 0) {
            createNotification({
                text: 'This action cannot be performed',
                type: 'error',
            });
            return Promise.resolve();
        }

        // No elements to move (either no allowed elements or all not applicable)
        if (result.allowedElements.length === 0) {
            return Promise.resolve();
        }

        // The move can be performed with the allowed elements
        // Use result.allowedElements for the actual move operation
    };

    return { applyLocation };
};
```
