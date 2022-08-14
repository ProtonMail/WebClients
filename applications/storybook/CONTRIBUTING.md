# Contributing

-   [React component stories](#react-component-stories)
-   [React component props](#react-component-props)
-   [Storybook Canvas block](#storybook-canvas-block)

## React component stories

The main way we intend to convey documentation about React Components in this Storybook is via Storybook's [MDX Docs Suppport](https://storybook.js.org/docs/react/writing-docs/mdx).

For that we employ the pattern of writing a couple of stories in a `Component.stories.tsx` file and linking them to an mdx documentation page through the `<Story />` Storybook Block by referencing the story's id like so:

```jsx
import { Canvas, Story } from '@storybook/addon-docs/blocks';

<Story id="story-id" />;
```

The name you call your mdx file does not matter as it has to be linked manually to the respective component stories file like so (however `Component.mdx` seems like a convenient pattern for mdx pages that are directly linked to a stories file of the same component):

```jsx
import mdx from './Component.mdx';
import Component from './Component.tsx';

export default {
    component: Component,
    title: 'Component',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};
```

The easiest way to find a story-id is by going to a running storybook instance and checking the url when on a story in the canvas:

<img src="./src/assets/storybook-story-id.png" width="400" alt="" />

However the story-id is computed from your story's title and its name, soit is also possible to predict it.

This pattern is documented in the following storybook 'recipe': [CSF Stories with arbitrary MDX](https://github.com/storybookjs/storybook/blob/next/addons/docs/docs/recipes.md#csf-stories-with-arbitrary-mdx)

## React component props

To show the arguments (props) for a certain component in the documentation page use the ArgsTable Storybook Block

```jsx
import { Alert } from 'react-components';

import { ArgsTable } from '@storybook/addon-docs/blocks';

<ArgsTable of={Alert} />;
```

<img src="./src/assets/storybook-argstable.png" alt="" />

Note: If you comment your props this way in your component in `react-components`:

```
interface Props extends React.HTMLProps<HTMLSpanElement> {
    text: string;
	/**
	 * Here is a super useful comment.
	 */
    charsToDisplayEnd?: number;
```

This comment will be present in StoryBook:

<img src="./src/assets/storybook-props-comments.png" alt="Comment available" />

There have been issues with typescript-docgen not being able to correctly extract the args/props for the ArgsTable. The following scenarios cause problems with that.

Importing a component under a different name than it was exported as

```js
/* bar.js */
import Baz from './foo';

/* foo.js */
export default Foo;
```

Exporting the component as an anonymous value, for example when wrapped in higher order functions and directly exported.

```js
const A = () => {
    /* ... */
};

export default forwardRef(A);
```

One option to deal with this is to wrap the component definition itself so that the wrapped component is named by a variable.

```js
const A = forwardRef(() => {
    /* ... */
});

export default A;
```

## Storybook Canvas block

Usually you'll see a `<Story />` wrapped inside the `<Canvas />` Storybook Block. This is done to show the source code alongside the inline story:

```jsx
import { Canvas, Story } from '@storybook/addon-docs/blocks';

<Canvas>
    <Story id="story-id" />
</Canvas>;
```

<img src="./src/assets/storybook-canvas-block.png" alt="" />
