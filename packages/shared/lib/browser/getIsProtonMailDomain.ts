const cache = window.location.hostname.endsWith('.protonmail.com');
export default function getIsProtonMailDomain() {
    return cache;
}
