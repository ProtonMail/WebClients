export const generateSumType = (types: string[]) => types.map((item) => `${item}`).join(' & ');
export const generateUnionType = (types: string[]) => types.map((item) => `${item}`).join(' | ');
export const refType = (ref: string) => ref.split('/').reverse()[0];
export const withJSDOC = (value: string, doc?: string) => (doc ? `\n/* ${doc} */\n${value}` : value);
export const optionalProp = (key: string, optional: boolean) => (optional ? `${key}?` : key);
export const nullableValue = (value: string, nullable: boolean) => (nullable ? `${value} | null` : value);
