# Pass Bridge

### Usage

#### Factory

Import the factory function and create a `PassBridge` instance with the necessary options.

```ts
import { createPassBridge } from '@proton/pass/lib/bridge';

const PassBridge = createPassBridge({ api, user, addresses, authStore });
```

#### React

In react, you can use the `PassBridgeProvider` component which will take care of creating the bridge and use the `usePassBridge` hook in the subtree.

```tsx
import { PassBridgeProvider, usePassBridge } from '@proton/pass/lib/bridge/PassBridgeProvider';
```

⚠️ Make sure the underlying models are available when creating the context. `PassBridge` requires the user and addresses to be fully loaded to instantiate properly.

### Aliases

#### Integration example

```ts
// Get all the aliases for the default user vault. If no vaults
// are available, a default one will be created.
const defaultVault = await PassBridge.vault.getDefault();
const aliasItems = await PassBridge.alias.getAllByShareId(defaultVault.shareId);

// Relevant information for alias items :
const { item, aliasDetails } = aliasItems[0]
const aliasEmail = aliasDetails.aliasEmail
const aliasMailboxes = aliasDetails.mailboxes
const { name, note } = item.data.metadata
// note is obfuscated, if you need to read it :
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor'
const clearNote = deobfuscate(note)

// Before creating a new alias, you need to request the current
// alias options - these options have a validity window of 10 minutes
// after which you will have to re-query the alias options. These options
// will give you the available suffixes and mailboxes
const aliasOptions = await PassBridge.alias.getAliasOptions(defaultVault.shareId);

// Creating an alias : let the user select the desired prefix, suffix and target mailbox.
// You can validate the final aliasEmail before submitting (prefix + suffix).
const prefix = 'some-user-input';
const mailbox = aliasOptions.mailboxes[0];
const { suffix, signedSuffix } = aliasOptions.suffixes[1];
const aliasEmail = `${prefix}${signedSuffix}`;

const alias = await PassBridge.alias.create({
    shareId: defaultVault.shareId,
    name: 'Alias for ProtonMail',
    note: 'Alias created from mail widget',
    alias: {
        mailbox,
        signedSuffix,
        prefix,
        aliasEmail,
    },
});
```
