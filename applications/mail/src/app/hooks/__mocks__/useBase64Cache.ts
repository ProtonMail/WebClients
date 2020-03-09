import { getInstance } from '../../helpers/test/cache';

export const cacheMock = getInstance();

export const useBase64Cache = () => cacheMock;
