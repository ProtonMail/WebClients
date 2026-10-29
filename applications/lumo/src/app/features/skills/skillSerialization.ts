import { decode as msgpackDecode, encode as msgpackEncode } from '@msgpack/msgpack';
import stableStringify from 'json-stable-stringify';

import {
    base64ToSkillKey,
    cryptoKeyToBase64,
    decryptString,
    decryptUint8Array,
    deriveSkillDataEncryptionKey,
    encryptString,
    encryptUint8Array,
    unwrapAesKeyWithMasterKeys,
    wrapAesKey,
} from '../../crypto';
import type { AesGcmCryptoKey, AesKwCryptoKey } from '../../crypto/types';
import type { MasterKeyContext } from '../../serialization';
import type { AdString } from '../../types';
import { safeLogger } from '../../util/safeLogger';
import type {
    SerializedSkill,
    SerializedSkillAsset,
    Skill,
    SkillAsset,
    SkillAssetPriv,
    SkillAssetPub,
    SkillConnector,
    SkillConnectorCategory,
    SkillKeyClear,
    SkillPriv,
    SkillPub,
    SubSkill,
} from './types';

const APP_NAME = 'lumo';

// Warning: changing the AD makes previously stored skills unreadable.
function getSkillAd({ id }: SkillPub): AdString {
    const ad = stableStringify({ app: APP_NAME, type: 'skill', id });
    if (!ad) throw new Error('Could not get AD for skill');
    return ad;
}

// Warning: changing the AD makes previously stored skill assets unreadable.
function getSkillAssetAd({ id, skillId }: SkillAssetPub): AdString {
    const ad = stableStringify({ app: APP_NAME, type: 'skill-asset', id, skillId });
    if (!ad) throw new Error('Could not get AD for skill asset');
    return ad;
}

export async function getSkillDek({ skillKey }: SkillKeyClear): Promise<AesGcmCryptoKey> {
    return deriveSkillDataEncryptionKey(Uint8Array.fromBase64(skillKey));
}

const getSkillPub = ({ id, createdAt, updatedAt, legacyAgentId }: SkillPub): SkillPub => ({
    id,
    createdAt,
    updatedAt,
    ...(legacyAgentId && { legacyAgentId }),
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isSubSkill = (value: unknown): value is SubSkill =>
    isRecord(value) &&
    typeof value.path === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.enabled === 'boolean';

const isConnector = (value: unknown): value is SkillConnector =>
    isRecord(value) && typeof value.name === 'string' && (value.url === undefined || typeof value.url === 'string');

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

const isConnectorCategory = (value: unknown): value is SkillConnectorCategory =>
    isRecord(value) &&
    typeof value.name === 'string' &&
    (value.placeholder === undefined || typeof value.placeholder === 'string') &&
    isStringArray(value.included) &&
    isStringArray(value.alternatives);

const getSkillPriv = (skill: SkillPriv): SkillPriv => {
    const { name, description, instructions, icon, enabled, source, metadata, conversationStarters } = skill;
    const { subSkills, plugin, connectors, connectorCategories, bundleIndexVersion } = skill as Record<
        keyof SkillPriv,
        unknown
    >;
    return {
        name,
        description,
        instructions,
        icon,
        enabled,
        source,
        metadata,
        conversationStarters,
        subSkills: Array.isArray(subSkills) ? subSkills.filter(isSubSkill) : undefined,
        plugin: isRecord(plugin)
            ? {
                  version: typeof plugin.version === 'string' ? plugin.version : undefined,
                  author: typeof plugin.author === 'string' ? plugin.author : undefined,
              }
            : undefined,
        connectors: Array.isArray(connectors) ? connectors.filter(isConnector) : undefined,
        connectorCategories: Array.isArray(connectorCategories)
            ? connectorCategories.filter(isConnectorCategory)
            : undefined,
        bundleIndexVersion: typeof bundleIndexVersion === 'number' ? bundleIndexVersion : undefined,
    };
};

const isSkillPriv = (value: unknown): value is SkillPriv => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const v = value as Record<string, unknown>;
    return (
        typeof v.name === 'string' &&
        typeof v.description === 'string' &&
        typeof v.instructions === 'string' &&
        typeof v.enabled === 'boolean' &&
        typeof v.source === 'string'
    );
};

export async function serializeSkill(skill: Skill, masterKey: AesKwCryptoKey): Promise<SerializedSkill> {
    const skillKey = await base64ToSkillKey(skill.skillKey, true);
    const wrappedSkillKey = (await wrapAesKey(skillKey, masterKey)).toBase64();
    const dek = await getSkillDek(skill);
    // legacyAgentId is repeated in the encrypted part because the server only stores that part
    const priv = { ...getSkillPriv(skill), ...(skill.legacyAgentId && { legacyAgentId: skill.legacyAgentId }) };
    const encrypted = await encryptString(JSON.stringify(priv), dek, getSkillAd(skill));
    return { ...getSkillPub(skill), wrappedSkillKey, encrypted };
}

/** Returns null for deleted or undecryptable skills. */
export async function deserializeSkill(
    serialized: SerializedSkill,
    masterKeys: MasterKeyContext
): Promise<Skill | null> {
    if (serialized.deleted) {
        return null;
    }
    try {
        const { key } = await unwrapAesKeyWithMasterKeys(
            Uint8Array.fromBase64(serialized.wrappedSkillKey),
            masterKeys.primary,
            masterKeys.legacy,
            true
        );
        const skillKeyClear: SkillKeyClear = { skillKey: await cryptoKeyToBase64(key.encryptKey) };
        const dek = await getSkillDek(skillKeyClear);
        const priv: unknown = JSON.parse(await decryptString(serialized.encrypted, dek, getSkillAd(serialized)));
        if (!isSkillPriv(priv)) {
            throw new Error('Deserialized object is not a SkillPriv');
        }
        const { legacyAgentId } = priv as { legacyAgentId?: unknown };
        const pub = getSkillPub({
            ...serialized,
            legacyAgentId: serialized.legacyAgentId ?? (typeof legacyAgentId === 'string' ? legacyAgentId : undefined),
        });
        return { ...pub, ...getSkillPriv(priv), ...skillKeyClear };
    } catch (e) {
        safeLogger.warn(`Cannot deserialize skill ${serialized.id}:`, e);
        return null;
    }
}

export async function serializeSkillAsset(asset: SkillAsset, dek: AesGcmCryptoKey): Promise<SerializedSkillAsset> {
    const { id, skillId, createdAt, updatedAt, path, mimeType, data } = asset;
    const pub: SkillAssetPub = { id, skillId, createdAt, updatedAt };
    const priv: SkillAssetPriv = { path, mimeType, data };
    const packed = msgpackEncode(priv) as Uint8Array<ArrayBuffer>;
    const encrypted = await encryptUint8Array(packed, dek, getSkillAssetAd(pub));
    return { ...pub, encrypted };
}

const isSkillAssetPriv = (value: unknown): value is SkillAssetPriv => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const v = value as Record<string, unknown>;
    return typeof v.path === 'string' && typeof v.mimeType === 'string' && v.data instanceof Uint8Array;
};

export async function deserializeSkillAsset(
    serialized: SerializedSkillAsset,
    dek: AesGcmCryptoKey
): Promise<SkillAsset | null> {
    if (serialized.deleted) {
        return null;
    }
    try {
        const { id, skillId, createdAt, updatedAt } = serialized;
        const pub: SkillAssetPub = { id, skillId, createdAt, updatedAt };
        const packed = await decryptUint8Array(serialized.encrypted, dek, getSkillAssetAd(pub));
        const priv = msgpackDecode(packed);
        if (!isSkillAssetPriv(priv)) {
            throw new Error('Deserialized object is not a SkillAssetPriv');
        }
        return { ...pub, path: priv.path, mimeType: priv.mimeType, data: new Uint8Array(priv.data) };
    } catch (e) {
        safeLogger.warn(`Cannot deserialize skill asset ${serialized.id}:`, e);
        return null;
    }
}
