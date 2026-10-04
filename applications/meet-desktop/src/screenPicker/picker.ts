import "./picker.css";
import type { ScreenPickerBridge, ScreenPickerSource, ScreenPickerSourceType } from "./types";

declare global {
    interface Window {
        screenPicker: ScreenPickerBridge;
    }
}

const bridge = window.screenPicker;

const getElement = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const grid = getElement<HTMLDivElement>("grid");
const empty = getElement<HTMLParagraphElement>("empty");
const shareButton = getElement<HTMLButtonElement>("share");
const cancelButton = getElement<HTMLButtonElement>("cancel");
const audioToggle = getElement<HTMLLabelElement>("audio");
const audioInput = getElement<HTMLInputElement>("audio-input");
const tabs: Record<ScreenPickerSourceType, HTMLButtonElement> = {
    screen: getElement("tab-screen"),
    window: getElement("tab-window"),
};

let loaded = false;
let sources: ScreenPickerSource[] = [];
let activeType: ScreenPickerSourceType = "screen";
let selectedId: string | undefined;
const cards = new Map<string, HTMLButtonElement>();

const share = () => {
    if (selectedId) {
        bridge.select({ id: selectedId, shareAudio: !audioToggle.hidden && audioInput.checked });
    }
};

const select = (id: string | undefined, focus = false) => {
    selectedId = id;
    cards.forEach((card, cardId) => {
        const isSelected = cardId === id;
        card.classList.toggle("is-selected", isSelected);
        card.setAttribute("aria-selected", String(isSelected));
        card.tabIndex = isSelected ? 0 : -1;
    });
    shareButton.disabled = !id;
    if (focus && id) {
        cards.get(id)?.focus();
    }
};

const createCard = (source: ScreenPickerSource) => {
    const card = document.createElement("button");
    card.className = "picker-card";
    card.setAttribute("role", "option");
    card.dataset.id = source.id;

    const preview = document.createElement("div");
    preview.className = "picker-card-preview";
    const thumbnail = document.createElement("img");
    thumbnail.className = "picker-card-thumbnail";
    thumbnail.alt = "";
    preview.append(thumbnail);

    const caption = document.createElement("div");
    caption.className = "picker-card-caption";
    const icon = document.createElement("img");
    icon.className = "picker-card-icon";
    icon.alt = "";
    const name = document.createElement("span");
    name.className = "picker-card-name";
    caption.append(icon, name);

    card.append(preview, caption);
    card.addEventListener("click", () => select(source.id));
    card.addEventListener("dblclick", () => {
        select(source.id);
        share();
    });
    return card;
};

const updateCard = (card: HTMLButtonElement, source: ScreenPickerSource) => {
    const thumbnail = card.querySelector<HTMLImageElement>(".picker-card-thumbnail")!;
    const icon = card.querySelector<HTMLImageElement>(".picker-card-icon")!;
    const name = card.querySelector<HTMLSpanElement>(".picker-card-name")!;

    if (source.thumbnail && thumbnail.src !== source.thumbnail) {
        thumbnail.src = source.thumbnail;
    }
    thumbnail.hidden = !source.thumbnail;
    icon.hidden = !source.appIcon;
    if (source.appIcon && icon.src !== source.appIcon) {
        icon.src = source.appIcon;
    }
    name.textContent = source.name;
    card.title = source.name;
};

// Cards are reused across refreshes so thumbnails update in place without losing focus or selection.
const render = () => {
    const visible = sources.filter((source) => source.type === activeType);
    const visibleIds = new Set(visible.map((source) => source.id));

    cards.forEach((card, id) => {
        if (!visibleIds.has(id)) {
            card.remove();
            cards.delete(id);
        }
    });

    visible.forEach((source) => {
        let card = cards.get(source.id);
        if (!card) {
            card = createCard(source);
            cards.set(source.id, card);
        }
        updateCard(card, source);
        grid.append(card);
    });

    empty.hidden = !loaded || visible.length > 0;
    grid.hidden = loaded && visible.length === 0;

    if (!selectedId || !visibleIds.has(selectedId)) {
        select(visible[0]?.id);
    } else {
        select(selectedId);
    }
};

const setActiveType = (type: ScreenPickerSourceType) => {
    activeType = type;
    (Object.keys(tabs) as ScreenPickerSourceType[]).forEach((tabType) => {
        const isActive = tabType === type;
        tabs[tabType].classList.toggle("is-active", isActive);
        tabs[tabType].setAttribute("aria-selected", String(isActive));
    });
    selectedId = undefined;
    render();
};

const getColumnCount = (visibleCards: HTMLButtonElement[]) => {
    const firstTop = visibleCards[0]?.offsetTop;
    return Math.max(1, visibleCards.filter((card) => card.offsetTop === firstTop).length);
};

const moveSelection = (key: string) => {
    const visibleCards = [...grid.querySelectorAll<HTMLButtonElement>(".picker-card")];
    if (!visibleCards.length) {
        return;
    }
    const current = Math.max(
        0,
        visibleCards.findIndex((card) => card.dataset.id === selectedId),
    );
    const columns = getColumnCount(visibleCards);
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
    const next = Math.min(visibleCards.length - 1, Math.max(0, current + offsets[key]));
    select(visibleCards[next].dataset.id, true);
};

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        bridge.cancel();
    } else if (event.key === "Enter" && document.activeElement?.classList.contains("picker-card")) {
        event.preventDefault();
        share();
    } else if (event.key.startsWith("Arrow") && document.activeElement?.classList.contains("picker-card")) {
        event.preventDefault();
        moveSelection(event.key);
    }
});

tabs.screen.addEventListener("click", () => setActiveType("screen"));
tabs.window.addEventListener("click", () => setActiveType("window"));
shareButton.addEventListener("click", share);
cancelButton.addEventListener("click", () => bridge.cancel());

bridge.onInit(({ labels, showAudioToggle, defaultSourceId }) => {
    document.title = labels.title;
    getElement("title").textContent = labels.title;
    tabs.screen.textContent = labels.screensTab;
    tabs.window.textContent = labels.windowsTab;
    getElement("audio-label").textContent = labels.shareAudio;
    shareButton.textContent = labels.share;
    cancelButton.textContent = labels.cancel;
    empty.textContent = labels.noWindows;
    audioToggle.hidden = !showAudioToggle;
    setActiveType("screen");
    selectedId = defaultSourceId;
});

bridge.onSources((nextSources) => {
    const isFirstLoad = !loaded;
    loaded = true;
    sources = nextSources;
    render();
    if (isFirstLoad && selectedId) {
        cards.get(selectedId)?.focus();
    }
});
