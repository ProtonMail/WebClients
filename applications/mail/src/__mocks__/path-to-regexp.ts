import { compile, match, pathToRegexp } from 'path-to-regexp';

(pathToRegexp as any).compile = compile;
(pathToRegexp as any).match = match;

module.exports = pathToRegexp;
