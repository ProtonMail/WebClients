export default function arraysContainSameElements<T>(array1: T[], array2: T[]) {
    if (array1.length !== array2.length) {
        return false;
    }

    return array1.every((element) => array2.includes(element));
}
