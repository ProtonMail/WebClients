import type { Base64 } from '../types';
import type { RemoteId } from './types';

export type RemoteSkillFile = {
    remoteId: RemoteId;
    /** Local skill asset id. */
    tag: string;
    createdAt: string;
};

export type RemoteSkill = {
    remoteId: RemoteId;
    /** Local skill id. */
    tag: string;
    createdAt: string;
    updatedAt: string;
    wrappedSkillKey: Base64;
    encrypted: Base64;
    files: RemoteSkillFile[];
};

export type NewSkillToApi = {
    SkillTag: string;
    SkillKey: Base64;
    Encrypted: Base64;
};

export type SkillToApi = Omit<NewSkillToApi, 'SkillTag'>;

export type NewSkillFileToApi = {
    SkillFileTag: string;
    Encrypted: Base64;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const requireString = (value: unknown, field: string): string => {
    if (typeof value !== 'string' || value === '') {
        throw new Error(`Invalid skill from API: missing ${field}`);
    }
    return value;
};

const requireDate = (value: unknown, field: string): string => {
    const date = new Date(requireString(value, field));
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid skill from API: bad ${field}`);
    }
    return date.toISOString();
};

const convertSkillFileFromApi = (input: unknown): RemoteSkillFile => {
    if (!isRecord(input)) {
        throw new Error('Invalid skill file from API: expected object');
    }
    return {
        remoteId: requireString(input.ID, 'ID'),
        tag: requireString(input.SkillFileTag, 'SkillFileTag'),
        createdAt: requireDate(input.CreateTime, 'CreateTime'),
    };
};

/** Returns null for deleted skills, which carry no key material or content. */
const convertSkillFromApi = (input: unknown): RemoteSkill | null => {
    if (!isRecord(input)) {
        throw new Error('Invalid skill from API: expected object');
    }
    if (input.DeleteTime) {
        return null;
    }
    return {
        remoteId: requireString(input.ID, 'ID'),
        tag: requireString(input.SkillTag, 'SkillTag'),
        createdAt: requireDate(input.CreateTime, 'CreateTime'),
        updatedAt: requireDate(input.UpdateTime, 'UpdateTime'),
        wrappedSkillKey: requireString(input.SkillKey, 'SkillKey'),
        encrypted: requireString(input.Encrypted, 'Encrypted'),
        files: Array.isArray(input.Files) ? input.Files.map(convertSkillFileFromApi) : [],
    };
};

export const convertSkillsFromApi = (input: unknown): RemoteSkill[] => {
    if (!Array.isArray(input)) {
        throw new Error('Invalid skills from API: expected array');
    }
    return input.map(convertSkillFromApi).filter((skill): skill is RemoteSkill => skill !== null);
};

/** The encrypted content of a single file, or null when it was deleted. */
export const convertSkillFileContentFromApi = (input: unknown): Base64 | null => {
    if (!isRecord(input)) {
        throw new Error('Invalid skill file from API: expected object');
    }
    if (input.DeleteTime || input.Encrypted === null || input.Encrypted === undefined) {
        return null;
    }
    return requireString(input.Encrypted, 'Encrypted');
};
