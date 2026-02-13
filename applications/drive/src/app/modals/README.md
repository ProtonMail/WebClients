# Modal Implementation Guidelines

Checklist that every modal should follow unless there is a specific requirement to differ:

## Structure

- `index.ts` that exposes `useXXXModal` which is a wrapper around `useModalTwoStatic`

- `useXXXModal` returns an object with these fields:
    - modal: the modal JSX itself
    - showModal: a function to open the modal

## Event Management

- `useXXXModal` handles connection to BusDriver event manager
    - Subscribing and handling BusDriver events is done inside the modal (not as argument configuration e.g. callbacks).
    - BusDriver event manager is part of the shared drive package and handles events from SDK/API.
    - BusDriver event manager is an internal implementation in an internal module and not re-exposed - only the Drive web client can (and must) access it.
    - If modal needs to provide response to the application, we provide callbacks that are distinct from the events - it's not a replacement.
    - By default, we do not provide callbacks, only where it is truly needed already today.

## Interface Parameters

- Interface to show modal includes minimum parameters, usually only two:
    - UID for what node or other resource to work with, making it explicit (avoiding ambiguity) - we define `nodeUid`, not just `uid`
    - An optional Drive SDK instance
        - Allow passing a Drive SDK instance as a param but default to the main SDK if not specified
        - If the modal depends on a particular Drive SDK instance type (e.g. the default Drive client to manipulate Devices), do not allow passing it as a param
    - An optional onSuccess callback: define it only if needed
    - Never use Volume or share ids.

## Usage Guidelines

- All new places (usually sections) use the `useXXXModal` directly (not via legacy modal in app/component/modals)

- Every new modal should not use legacy events and back-end APIs, but should use the Drive SDK instead

### Example

```typescript
// In the modal's index.ts
export const useShareModal = () => {
    // Hook implementation
    return { modal: shareModalJsx, showModal: shareModalOpenFunction };
};

// In a component
const { modal: shareModal, showModal: showShareModal } = useShareModal();

// Show the modal with required parameters
showShareModal({ drive, nodeUid: 'abc123' });
```
