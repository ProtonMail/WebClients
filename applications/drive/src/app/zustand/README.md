# Best practices with Zustand

## useShallow

Each time your consume a store with either (1) computed values or (2) multiple values, you should use `useShallow`

```typescript
import { useShallow } from 'zustand/react/shallow'
import { useSharesStore } from '../../../zustand/share/shares.store';

// BAD - will rerender on any share changes
const { shares, lockedVolumesForRestore } = useSharesStore()

// GOOD - only rerenders when the selected values change
const { shares, lockedVolumesForRestore } = useSharesStore(
  useShallow((state) => ({
    shares: state.shares,
    lockedVolumesForRestore: state.lockedVolumesForRestore
  }))
)

// No need for useShallow - selecting single value
const shares = useSharesStore((state) => state.shares)

// No need for useShallow - selecting methods only
const { setShares, removeShares } = useSharesStore((state) => ({
  setShares: state.setShares,
  removeShares: state.removeShares
}))

// GOOD - useShallow when selecting multiple computed values
const { lockedShares, defaultShareId } = useSharesStore(
    useShallow((state) => ({
        lockedShares: state.getLockedShares,
        defaultShareId: state.getDefaultShareId
    }))
)
```

## Always select only the values you need, don't destructure the whole store

```typescript
// BAD - don't destructure the whole store
const store = useSharesStore();

// GOOD - only select what you need
const getShare = useSharesStore((state) => state.getShare);
```
