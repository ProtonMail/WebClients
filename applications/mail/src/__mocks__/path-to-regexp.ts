import { pathToRegexp, compile, match } from 'path-to-regexp';

(pathToRegexp as any).compile = compile;
(pathToRegexp as any).match = match;

module.exports = pathToRegexp;
