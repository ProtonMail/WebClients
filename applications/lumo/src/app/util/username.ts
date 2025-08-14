export function isLetter(c: string): boolean {
    return /^\p{L}/u.test(c);
}

export function getInitials(username: string | undefined) {
    if (username === undefined) {
        return 'You';
    }

    const splits = username.split(' ');
    const initials = splits
        .map((s) => s[0])
        .filter((c) => c !== undefined && isLetter(c))
        .map((c) => c.toUpperCase());

    // "209202392" -> "You"
    if (initials.length == 0) {
        return 'You';
    }

    // "john" -> "J"
    // "Marie-Anne" -> "M"
    if (initials.length == 1) {
        return initials[0];
    }

    // "John Doe" -> "JD"
    // "Orange Services" -> "OS"
    if (initials.length == 2) {
        return `${initials[0]}${initials[1]}`;
    }

    // "Eric S. Raymond" -> "ESR"
    // "Orange Service Client" -> "OSC"
    if (initials.length == 3) {
        return `${initials[0]}${initials[1]}${initials[2]}`;
    }

    // "Santa's List International Communication" -> "SL"
    return `${initials[0]}${initials[1]}`;
}
