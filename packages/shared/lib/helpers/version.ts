export class Version {
    version: number[];

    constructor(version: string) {
        this.version = this.getSemanticVersion(version);
    }

    private getSemanticVersion(version: string): number[] {
        const array = version.split('.').map(Number);
        // remove trailing .0 if any
        while (array.at(-1) === 0) {
            array.pop();
        }
        return array;
    }

    /**
     * Compares the version number stored in this instance with a given version number string.
     *
     * @param {string} comparison - The version number to compare against in the format 'major.minor.patch'.
     * @returns {-1 | 0 | 1} - Returns -1 if this version is lower, 1 if it is higher, or 0 if they are equal.
     */
    private compare(comparison: string): -1 | 0 | 1 {
        const comparedVersion = this.getSemanticVersion(comparison);

        // Loop through each segment of the version numbers.
        for (let i = 0; true; i++) {
            // If the end of both versions is reached simultaneously, they are equal.
            if (i >= comparedVersion.length) {
                return i >= this.version.length ? 0 : 1;
            }
            // If this version ends before the compared version, this version is lower.
            if (i >= this.version.length) {
                return -1;
            }
            // Calculate the difference between the same segment of the two versions.
            const diff = this.version[i] - comparedVersion[i];
            // If there is a difference, determine which version is greater.
            if (diff !== 0) {
                return diff > 0 ? 1 : -1;
            }
        }
    }

    public isEqualTo(comparison: string): boolean {
        return this.compare(comparison) === 0;
    }

    public isGreaterThan(comparison: string): boolean {
        return this.compare(comparison) === 1;
    }

    public isSmallerThan(comparison: string): boolean {
        return this.compare(comparison) === -1;
    }

    public isGreaterThanOrEqual(comparison: string): boolean {
        return this.isGreaterThan(comparison) || this.isEqualTo(comparison);
    }

    public isSmallerThanOrEqual(comparison: string): boolean {
        return !this.isGreaterThan(comparison) || this.isEqualTo(comparison);
    }
}
