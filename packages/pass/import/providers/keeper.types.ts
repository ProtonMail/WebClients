export type KeeperItem = [
    string, // folder name
    string, // title (can't be an empty string)
    string, // username
    string, // url
    string, // password
    string, // note
    string, // shared folder name
    // custom fields, KeeperItem[i] is the label of a custom field and KeeperItem[i + 1] is the value of that custom field, for 7 < i < KeeperItem.length-1
    ...string[]
];
