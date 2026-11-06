// Re-exports eslint-plugin-compat so it resolves from this package. oxlint resolves `jsPlugins` specifiers from each
// consumer's config file, and only this package depends on the plugin.
export { default } from 'eslint-plugin-compat';
