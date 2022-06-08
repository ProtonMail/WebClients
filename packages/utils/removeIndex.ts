/**
 * Removes item at "index" from "array"
 */
const removeIndex = <T>(array: T[], index: number) => array.filter((_, i) => i !== index);

export default removeIndex;
