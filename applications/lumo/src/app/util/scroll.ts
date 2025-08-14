export function scrollToBottom(e: HTMLDivElement) {
    if (e) {
        e.scrollTo({ left: 0, top: 99999, behavior: 'smooth' });
    }
}

export function scrollToBottomDelayed(e: HTMLDivElement) {
    setTimeout(() => scrollToBottom(e), 100);
}

export function scrollToTop(e: HTMLDivElement) {
    if (e) {
        e.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
}

export function scrollToTopDelayed(e: HTMLDivElement) {
    setTimeout(() => scrollToTop(e), 100);
}
