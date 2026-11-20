import { SERVICE_ACCOUNT_NAME_SUGGESTIONS, getSuggestedServiceAccountName } from './suggestedServiceAccountNames';

vi.mock('@proton/utils/randomIntFromInterval', () => ({ __esModule: true, default: () => 0 }));

it('skips used suggestions regardless of case or surrounding whitespace', () => {
    const existing = SERVICE_ACCOUNT_NAME_SUGGESTIONS.filter((name) => name !== 'data-pipeline').map(
        (name) => ` ${name.toUpperCase()} `
    );
    expect(getSuggestedServiceAccountName(existing)).toBe('data-pipeline');
});

it('finds an unused suffixed name when every suggestion is taken', () => {
    const existing = [...SERVICE_ACCOUNT_NAME_SUGGESTIONS, 'CI-BOT-1', ' ci-bot-2 '];
    expect(getSuggestedServiceAccountName(existing)).toBe('ci-bot-3');
});
