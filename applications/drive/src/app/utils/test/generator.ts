export async function asyncGeneratorToArray<T>(generator: AsyncGenerator<T>): Promise<T[]> {
    const result = [];
    for await (const item of generator) {
        result.push(item);
    }
    return result;
}
