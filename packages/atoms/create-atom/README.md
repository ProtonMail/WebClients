# Create atom

A script to create the skeleton of an atom for `@proton/atoms`. Based on https://github.com/joshwcomeau/new-component

## Example

The script takes 1 argument - the name of the component. For example,

```
yarn create-atom MyAtom
```

This will create a `MyAtom` directory in `@proton/atoms` and output the following skeleton files

```
index.ts // Exports all exports from component file
MyAtom.mdx // Markdown docs for storybook
MyAtom.scss // Contains the styles
MyAtom.stories.tsx // Stories for storybook
MyAtom.test.tsx // Tests for the component
MyAtom.tsx // The actual component
```

## Monorepo script

You can run the script from the monorepo root using `yarn create-atom MyAtom`.
