# Create atom

A script to create the skeleton of an atom for `@proton/atoms`. Based on https://github.com/joshwcomeau/new-component

## Example

The script takes 1 argument - the name of the component. For example,

```
yarn create-atom MyAtom
```

This will create a `MyAtom` directory in `@proton/atoms` and output the following skeleton files

```
MyAtom.mdx // Markdown docs for storybook
MyAtom.scss // Contains the styles
MyAtom.stories.tsx // Stories for storybook
MyAtom.test.tsx // Tests for the component
MyAtom.tsx // The actual component
```

## Register the export (required)

The script only scaffolds the component files — it does **not** update `@proton/atoms`'s `exports` field. That field is an explicit allowlist, so until you add the new atom there it cannot be imported (`Module not found: ... is not exported under the conditions ...`, including from Storybook).

After generating, add an entry to the `exports` map in [`packages/atoms/package.json`](../package.json), keeping it alphabetical:

```jsonc
"exports": {
    // ...
    "./MyAtom/MyAtom": "./src/MyAtom/MyAtom.tsx",
    // ...
}
```

Consumers (and stories) then import it as `import { MyAtom } from '@proton/atoms/MyAtom/MyAtom';`. A running Storybook/webpack dev server caches the `exports` field, so restart it after editing.

## Monorepo script

You can run the script from the monorepo root using `yarn create-atom MyAtom`.
