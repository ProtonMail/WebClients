# Contributing guide

## Quick introduction

> Read the [README](./README.md) first if you haven't yet.

This is a React application. Some key points:

- It's a SPA, routing is handled with `react-router-dom`. Completely configuration based, although the file structure is inspired by file-based routers. Read more in the "File structure > Routes" section below. Routes are lazily loaded with `React.lazy()` + `Suspense`.
- Styling is achieved with Tailwind CSS + Proton theme + SASS in some places.
  <!-- TODO: investigate and elaborate on the Proton theme stuff -->
  <!-- TODO: investigate and elaborate on some other relevant patterns like the pub/sub stuff -->
  <!-- TODO: investigate and elaborate generally on architecture, put excalidraw here as well -->

## Glossary

- **Document**: a Proton text document.
- **Document viewer**: the UI that displays a document, and allows editing it if the user has the right permissions.
- **Docs homepage**: the page that lists documents (most recent, owned by me, owned by others...).

## File structure

### Tree

Here's a brief overview of the file structure:

```
src/app/             # Main directory
├── components/      # Components that are used in a lot of places. Mostly flat structure.
├── routes/          # Route-aware files. Pages, layouts, and local components and utilities. See below.

       (TODO: complete)

└─── index.tsx        # Entrypoint. Loads the CSS files, and renders the public or user app.
```

### Guidelines

- Use `kebab-case` for file and directory names.
  - Exception 1: files which have the single/main purpose of exporting a specific React component. Use the component name in the same case instead (e.g. `DocumentToolbar.tsx`).
  - Exception 2: see "routes" section below.
- Don't group by "what it is" (e.g. "hooks"). Instead, group by purpose (e.g. "utils").
  - Note: `components/` gets a pass because "components" is a "what it is" category (a JavaScript function that returns a tree of React elements or other valid React node values) but also a "purpose" category (chunks of UI to be used throughout the app).
- Large files that contain many things are fine, as long as the grouping makes sense and it's well organized. For example, a `utils/auth.ts` file that exports 15 things is fine.
- Don't create too many categories or nested directories. Keep it simple and flat.

### The golden rule: co-location (vs. dis-location)

Code that changes together should be located together.

1. If a component/function/whatever is only used in one place, it should be colocated with that place. For example, a `DocumentToolbar` component that is only used by the "Document viewer" page should be next to it (either in the same file or somewhere nearby).
2. Once it's used in more than one place, it should be moved to the closest shared location. For example, if `DocumentToolbar` is used by both the "Document viewer" and the "Document editor" pages, it should be moved somewhere in the directory that contains both pages.
3. If it's used in many places, it should then be moved (dis-located) to a top-level location. For example, a generic `Button` component that is used everywhere can be placed in a `components/` directory somewhere near the root.

Why co-location is good:

- Code is easier to find and understand.
- Easier to maintain: remember, that code is located together _because it changes together_.
- Easier to refactor: you can delete, rename, change and move things around without worrying about breaking other parts of the app.
- More efficient: by having a clearer picture of how specific or generic a component is, you can decide how much to spend or **NOT to spend** making it generic, reusable, well documented, making its API nice, etc.

Why (unjustified) dis-location is bad:

- Code is harder to find and understand.
- Harder to maintain: you have to remember where things are, and what they do, and how they interact with other things.
- Harder to refactor: you have to worry about breaking other parts of the app.
- Less efficient: it's harder to tell how much something needs to be polished or generalized. You can easily end up wasting time.
- Bonus: it's much easier to leave things outdated, as its easy to forget about something when it's located far away from where you're working. It can even lead to dead code that is never used anywhere.

### Routes

To keep everything as co-located as possible, and make routes simpler to understand and maintain, we use a specific file structure for `routes/` inspired by file-based routers.

- Directories are URL paths. For example, a `routes/foo/bar/` directory corresponds to the `/foo/bar` URL.

  - Exception 1: directories can be named with parentheses to group routes without the implication that it represents a URL path.

    For example, `routes/(user)/` and `routes/(public)/` contain the files for the user and public parts of the app, respectively. However, both share the same URL path, since which one is rendered is not determined by the URL.

    Another example: `routes/(public)/foo/(bar)/baz/` represents the URL path `/foo/baz` (for the public part of the app).

  - Exception 2: directories that start with a double underscore `__` are not considered URL paths either. Their purpose is a bit different to directories with parentheses: they are used to group files that are "local" to the current `route/` or `(group)`. Typically, these directories are `__components/` (for components) and `__utils/` (for pretty much anything else).

- Files named `page.tsx` are route entrypoints. They default export a React component (the "page" component) that doesn't take any props.

> Note: keep in mind that since we still use a traditional router, the URL path is not _actually_ determined by the file structure. However, this structure is still helpful to keep things colocated, and to be explicit about URL paths.

> Tip: to quickly find a page, you can use your editor's fuzzy file search feature (e.g. `Cmd+P`/`Ctrl+P` in VSCode) and type in the URL path. E.g. you can easily find `routes/(public)/foo/(bar)/baz/page.tsx` by typing `foo/baz` (or `foo/baz/page` if necessary).

## General coding guidelines

- Write good.
  - Full variable names.
  - JSDocs and comments where helpful.
  - Modern, idiomatic JavaScript.
  - Simple, flat.
  - Just use common sense.
- Don't write bad.
  - Convoluted, undocumented abstractions.
  - Over-engineered solutions.
  - Terrible names.
  - Uncommented spaghetti code.
  - The information you have about the code you wrote:
    - In your head: bad. Terrible. Expect to lose hours trying to remember what you did and why while wasting the time of the multiple people that will ask you about it over the years.
    - In the codebase (as docs, good structure, good names, etc): good. Awesome even. You can forget about it forever.
  - Save other people (and yourself in a year) 3 hours in the future trying to make sense of your code by spending 5 minutes now making it good.
- Make bad into good.
  - Jokes aside, do little refactors in your everyday work.
  - Add a comment here, rename a variable there.
  - If something changes, take a moment to rename stuff, tweak docs, etc. Do not leave stuff outdated.
  - Leave code better than you found it.
  - Let's not create technical debt for no reason! Take the two extra minutes!
- NO DEFAULT EXPORTS. EVER.
  - Use named exports instead.
  - [Really, just don't do it.](https://www.lloydatkinson.net/posts/2022/default-exports-in-javascript-modules-are-terrible/)

## React component guidelines

Always use named functions. Makes code easier to scan, and not doing so can lead to issues with React DevTools.

```tsx
// Good
function MyComponent() {
  return <div />
}

// Bad
const MyComponent = () => {
  return <div />
}
```

The exception is `React.forwardRef` (until React 19 makes it unnecessary) or `React.memo`. However, even in those cases you must pass a named function as a callback. It's not just (good) taste, but it again prevent issues with React DevTools in practice.

---

Always create a props type (if it takes any props). Use the name of the component with `Props` appended. If the component is exported, the props type should be exported as well.

```tsx
type MyComponentProps = {
  foo: string
}
```

---

Never default-export a component. Default exports are the purest form of evil known to humankind. Use a named export instead.

```tsx
// Good
export function MyComponent() {
  return <div />
}

// Bad and you will be punished in the afterlife for this
export default function MyComponent() {
  return <div />
}
```

The only exception is when a component has to be imported through React's `lazy()` function.
