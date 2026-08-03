import { config } from 'proton-authenticator/lib/app/env';

const { API_URL } = config;

export const DATABASE_NAME = API_URL.includes('proton.black') ? 'authenticatordb_black' : 'authenticatordb';
