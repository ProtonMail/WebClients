import { pathToRegexp, compile } from 'path-to-regexp';

(pathToRegexp as any).compile = compile;

module.exports = pathToRegexp;
