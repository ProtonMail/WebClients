export function sanitizeObject<T>(objectInput: Record<string, any>, allowedKeys: Set<keyof T>): T {
    const object: Partial<T> = {};
    for (const key of Object.keys(objectInput)) {
        const typedKey = key as keyof T;
        if (allowedKeys.has(typedKey)) {
            object[typedKey] = objectInput[key];
        }
    }

    return object as T;
}
