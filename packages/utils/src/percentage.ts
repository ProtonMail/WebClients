export default function percentage(entire: number, fraction: number) {
    /*
     * Safeguard against division by 0 error as well as
     * NaN inputs for either "entire" or "fraction".
     */
    if (!entire || !fraction) {
        return 0;
    }

    return (fraction / entire) * 100;
}
