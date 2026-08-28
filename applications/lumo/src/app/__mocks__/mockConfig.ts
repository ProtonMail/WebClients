// Mock configuration types
export type ScenarioType = 'success' | 'error' | 'timeout' | 'toolCall' | 'weeklyLimit' | 'rejected';

export interface IMockConfig {
    setScenario(scenario: ScenarioType): void;
    getScenario(): ScenarioType;
}

class MockConfig implements IMockConfig {
    private static instance: MockConfig;

    private currentScenario: ScenarioType = 'success';

    private constructor() {
        // Private constructor to enforce a singleton pattern
    }

    public static getInstance(): IMockConfig {
        if (!MockConfig.instance) {
            MockConfig.instance = new MockConfig();
        }
        return MockConfig.instance;
    }

    public setScenario(scenario: ScenarioType) {
        this.currentScenario = scenario;
        console.log(`🔶 Mock Config: Scenario set to: ${scenario}`);
    }

    public getScenario(): ScenarioType {
        return this.currentScenario;
    }
}

export const mockConfig: IMockConfig = MockConfig.getInstance();

// Make mock config available globally for testing
declare global {
    interface Window {
        mockConfig: IMockConfig;
    }
}

if (typeof window !== 'undefined') {
    window.mockConfig = mockConfig;
}
