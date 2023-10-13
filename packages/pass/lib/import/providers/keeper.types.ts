export type KeeperItem = [
    /* folder name */
    string,
    /* title (can't be an empty string) */
    string,
    /* username */
    string,
    /* url */
    string,
    /* password */
    string,
    /* note */
    string,
    /* shared folder name */
    string,
    /* custom fields:
     * KeeperItem[7 + n]: label of a custom field
     * KeeperItem[7 + (n + 1)]: value of that custom field */
    ...string[],
];
