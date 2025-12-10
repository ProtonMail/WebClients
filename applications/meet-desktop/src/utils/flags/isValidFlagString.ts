const dangerousPatterns = [
    "__proto__",
    "constructor",
    "prototype",
    "__definegetter__",
    "__definesetter__",
    "__lookupgetter__",
    "__lookupsetter__",
];

export const isValidFlagString = (jsonString: string): boolean => {
    const lowerStr = jsonString.toLowerCase();
    return !dangerousPatterns.some((pattern) => lowerStr.includes(pattern));
};
