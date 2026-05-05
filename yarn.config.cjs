// @ts-check

/** @type {import('@yarnpkg/types')} */
const {defineConfig} = require(`@yarnpkg/types`);

/**
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Context} Context
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Workspace} Workspace
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Dependency} Dependency
 */

/**
 * These set of dependencies resolve to the same version configured through `resolutions`
 * in the root package.json .
 * We enforce that workspaces declare them with version `"*"` to signal that the resolution
 * is deferred.
 */
const ENFORCE_STAR_DEPENDENCY_FOR = new Set(['@protontech/crypto']);
/**
 * This rule will enforce that workspaces MUST depend on consistent versions for certain dependencies.
 * The resolved version of such dependencies is handled 
 * @param {Context} context
 */
function enforceConsistentDependenciesAcrossTheProject({Yarn}) {
  for (const enforcedDependencyId of ENFORCE_STAR_DEPENDENCY_FOR) {
    const unexpectedDependecies = Yarn.dependencies({ident: enforcedDependencyId }).filter(({ range }) => range !== '*');
    if (unexpectedDependecies.length > 0) {
      unexpectedDependecies[0].error(`Unexpected dependency version ${unexpectedDependecies[0].range} for ${enforcedDependencyId}; use '*' instead.`);
    }      
  }
}

module.exports = defineConfig({
  constraints: async ctx => {
    enforceConsistentDependenciesAcrossTheProject(ctx);
  },
});