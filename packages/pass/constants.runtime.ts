export const AGENT_INSTRUCTIONS_URL =
    EXTENSION_BUILD || DESKTOP_BUILD
        ? 'https://proton.me/download/pass/agent-data/agent-instructions.md'
        : '/assets/agent-instructions.md'; // HOTFIX CSP
