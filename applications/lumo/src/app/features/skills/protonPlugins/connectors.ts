import type { ProtonPluginConnector } from './types';

/** Connector categories shared by Proton plugins, keyed to what Lumo Desktop can connect. */
export const EMAIL: ProtonPluginConnector = { category: 'Email', placeholder: '~~email', included: ['Proton Mail'] };

export const CHAT: ProtonPluginConnector = { category: 'Chat', placeholder: '~~chat', included: ['Slack'] };

export const CLOUD_STORAGE: ProtonPluginConnector = {
    category: 'Cloud storage',
    placeholder: '~~cloud storage',
    included: ['Google Drive', 'Dropbox'],
};

export const LOCAL_FILES: ProtonPluginConnector = {
    category: 'Local files',
    placeholder: '~~local files',
    included: ['Filesystem'],
};

export const PROJECT_TRACKER: ProtonPluginConnector = {
    category: 'Project tracker',
    placeholder: '~~project tracker',
    included: ['Linear', 'Asana', 'Atlassian (Jira)'],
};

export const KNOWLEDGE_BASE: ProtonPluginConnector = {
    category: 'Knowledge base',
    placeholder: '~~knowledge base',
    included: ['Atlassian (Confluence)'],
};

export const DESIGN_TOOL: ProtonPluginConnector = { category: 'Design', placeholder: '~~design', included: ['Figma'] };

export const DATA_WAREHOUSE: ProtonPluginConnector = {
    category: 'Data warehouse',
    placeholder: '~~data warehouse',
    included: ['Snowflake', 'Databricks', 'BigQuery'],
};

export const SOURCE_CONTROL: ProtonPluginConnector = {
    category: 'Source control',
    placeholder: '~~source control',
    included: ['GitHub'],
};

export const BROWSER: ProtonPluginConnector = {
    category: 'Browser',
    placeholder: '~~browser',
    included: ['Chrome DevTools'],
};

export const MONITORING: ProtonPluginConnector = {
    category: 'Monitoring',
    placeholder: '~~monitoring',
    included: ['Grafana', 'Datadog'],
};

export const INCIDENT_MANAGEMENT: ProtonPluginConnector = {
    category: 'Incident management',
    placeholder: '~~incident management',
    included: ['PagerDuty'],
};

export const SUPPORT_PLATFORM: ProtonPluginConnector = {
    category: 'Support platform',
    placeholder: '~~support platform',
    included: ['Zendesk'],
};

export const ATS: ProtonPluginConnector = {
    category: 'Applicant tracking',
    placeholder: '~~ATS',
    included: ['Greenhouse'],
};
