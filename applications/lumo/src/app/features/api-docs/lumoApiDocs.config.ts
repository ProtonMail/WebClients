/**
 * Lumo API documentation spec — extend this file as new endpoints and models ship.
 * UI copy is composed in components; structural data lives here.
 * Code examples use plain HTTP (curl, requests, fetch, reqwest), not a Lumo SDK.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type EndpointStatus = 'ga' | 'beta';

export type CodeLang = 'curl' | 'python' | 'typescript' | 'rust';

export type ChatExampleVariant = 'basic' | 'tool_call' ;

export interface ApiDocParameter {
    name: string;
    type: string;
    required: boolean;
    /** Plain text; components apply i18n where needed */
    description: string;
    default?: string;
}

export interface ApiDocEndpoint {
    id: string;
    method: HttpMethod;
    /** Path segment after base URL, e.g. "/chat/completions" */
    path: string;
    status: EndpointStatus;
    openaiCompatible?: boolean;
    description: string;
    parameters?: ApiDocParameter[];
}

export interface ApiDocEndpointGroup {
    id: string;
    endpoints: ApiDocEndpoint[];
}

export interface ApiDocModel {
    id: string;
    label: string;
    description: string;
    contextWindow: string;
    tasks: string[];
}

export interface LumoApiDocsSpec {
    versionLabel: string;
    /** Shown in overview and used to build example request URLs */
    apiBaseUrl: string;
    endpointGroups: ApiDocEndpointGroup[];
    models: ApiDocModel[];
    /** Keys match ChatExampleVariant */
    chatExamples: Record<ChatExampleVariant, Record<CodeLang, string>>;
    authExamples: Record<CodeLang, string>;
}

export const LUMO_API_DOCS_SPEC: LumoApiDocsSpec = {
    versionLabel: 'v1',
    apiBaseUrl: 'https://lumo.proton.me/api/ai/v1',
    endpointGroups: [
        {
            id: 'chat',
            endpoints: [
                {
                    id: 'ep-chat-completions',
                    method: 'POST',
                    path: '/chat/completions',
                    status: 'ga',
                    openaiCompatible: true,
                    description:
                        'Send a list of messages and receive a completion. Supports streaming, tool calls, vision, and multi-turn conversations. Fully compatible with the OpenAI chat completions schema — swap the base URL and header and you are done.',
                    parameters: [
                        {
                            name: 'model',
                            type: 'string',
                            required: true,
                            description:
                                'Model ID. Use `auto` to let Lumo route to the best model for your task.',
                        },
                        {
                            name: 'messages',
                            type: 'array',
                            required: true,
                            description:
                                'Conversation history as a list of `{role, content}` objects. Roles: `system`, `user`, `assistant`.',
                        },
                        {
                            name: 'stream',
                            type: 'boolean',
                            required: false,
                            description: 'Stream tokens as server-sent events.',
                            default: 'false',
                        },
                        {
                            name: 'tools',
                            type: 'array',
                            required: false,
                            description:
                                'List of function definitions the model may invoke. Each tool has a `name`, `description`, and JSON Schema `parameters`.',
                        },
                        {
                            name: 'max_tokens',
                            type: 'integer | null',
                            required: false,
                            description: "Maximum tokens in the completion. Defaults to the model's output limit.",
                        },
                        {
                            name: 'temperature',
                            type: 'number',
                            required: false,
                            description: 'Sampling temperature (0–2). Lower values produce more deterministic output.',
                            default: '1.0',
                        },
                    ],
                },
            ],
        },
        {
            id: 'models',
            endpoints: [
                {
                    id: 'ep-models-list',
                    method: 'GET',
                    path: '/models',
                    status: 'ga',
                    description:
                        'Returns the list of models currently available via the API, including task affinities and context window sizes. No parameters required.',
                },
            ],
        },
    ],
    models: [
        {
            id: 'auto',
            label: 'Auto-route',
            description:
                'Lumo selects the optimal model based on your task type, prompt, and cost preference. Recommended for most use cases.',
            contextWindow: '200k',
            tasks: ['chat', 'analysis', 'vision', 'code'],
        },
        {
            id: 'lumo-fast',
            label: 'Lumo Fast',
            description:
                'Optimised for low-latency, high-throughput workloads. Best for classification, short-form generation, and real-time applications.',
            contextWindow: '266k',
            tasks: ['chat', 'classification', 'vision', 'extraction'],
        },
        {
            id: 'lumo-thinking',
            label: 'Lumo Thinking',
            description:
                'Best-in-class reasoning for complex analytical tasks, multi-step code generation, and long-document synthesis.',
            contextWindow: '200k',
            tasks: ['analysis', 'code', 'vision', 'reasoning'],
        },
    ],
    chatExamples: {
        basic: {
            curl: `curl https://lumo.proton.me/api/ai/v1/chat/completions \\
  -H "Authorization: Bearer $LUMO_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Explain quantum entanglement."}]
  }'`,
            python: `import os
import requests

url = "https://lumo.proton.me/api/ai/v1/chat/completions"
headers = {
    "Authorization": "Bearer " + os.environ["LUMO_API_KEY"],
    "Content-Type": "application/json",
}
payload = {
    "model": "auto",
    "messages": [{"role": "user", "content": "Explain quantum entanglement."}],
}
r = requests.post(url, headers=headers, json=payload, timeout=120)
r.raise_for_status()
print(r.json()["choices"][0]["message"]["content"])`,
            typescript: `const url = "https://lumo.proton.me/api/ai/v1/chat/completions";
const response = await fetch(url, {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.LUMO_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "auto",
    messages: [{ role: "user", content: "Explain quantum entanglement." }],
  }),
});
if (!response.ok) throw new Error("HTTP " + response.status);
const data = await response.json();
console.log(data.choices[0].message.content);`,
            rust: `use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let res = client
        .post("https://lumo.proton.me/api/ai/v1/chat/completions")
        .header("Authorization", "Bearer " + std::env::var("LUMO_API_KEY")?)
        .header("Content-Type", "application/json")
        .json(&json!({
            "model": "auto",
            "messages": [{"role": "user", "content": "Explain quantum entanglement."}]
        }))
        .send()
        .await?;
    let body: serde_json::Value = res.json().await?;
    println!(
        "{}",
        body["choices"][0]["message"]["content"].as_str().unwrap_or("")
    );
    Ok(())
}`,
        },
        tool_call: {
            curl: `curl https://lumo.proton.me/api/ai/v1/chat/completions \\
  -H "Authorization: Bearer $LUMO_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "What is the weather in Geneva?"}],
    "tools": ["web_search"]
  }'`,
            python: `import os
import requests

url = "https://lumo.proton.me/api/ai/v1/chat/completions"
headers = {
    "Authorization": "Bearer" + os.environ["LUMO_API_KEY"],
    "Content-Type": "application/json",
}
payload = {
    "model": "auto",
    "messages": [{"role": "user", "content": "What is the weather in Geneva?"}],
    "tools": ["web_search"],
}
r = requests.post(url, headers=headers, json=payload, timeout=120)
r.raise_for_status()`,
            typescript: `const url = "https://lumo.proton.me/api/ai/v1/chat/completions";
const response = await fetch(url, {
  method: "POST",
  headers: {
    "Authorization": "Bearer" + process.env.LUMO_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "auto",
    messages: [{ role: "user", content: "What is the weather in Geneva?" }],
    tools: ["web_search"],
  }),
});
const data = await response.json();
console.log(data.choices[0].message.tool_calls);`,
            rust: `use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let res = client
        .post("https://lumo.proton.me/api/ai/v1/chat/completions")
        .header("Authorization", std::env::var("LUMO_API_KEY")?)
        .header("Content-Type", "application/json")
        .json(&json!({
            "model": "auto",
            "messages": [{"role": "user", "content": "What is the weather in Geneva?"}],
            "tools": ["web_search"]
        }))
        .send()
        .await?;
    let body: serde_json::Value = res.json().await?;
    println!("{:?}", body["choices"][0]["message"]["tool_calls"]);
    Ok(())
}`,
        },
    },
    authExamples: {
        curl: `curl https://lumo.proton.me/api/ai/v1/chat/completions \\
  -H "Authorization: Bearer $LUMO_API_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{"model": "auto", "messages": [{"role": "user", "content": "Hello"}]}'`,
        python: `import os
import requests

# Send your API key on every request (never commit it to source control)
r = requests.post(
    "https://lumo.proton.me/api/ai/v1/chat/completions",
    headers={
        "Authorization": "Bearer " + os.environ["LUMO_API_KEY"],
        "Content-Type": "application/json",
    },
    json={
        "model": "auto",
        "messages": [{"role": "user", "content": "Hello"}],
    },
    timeout=120,
)
r.raise_for_status()
print(r.json())`,
        typescript: `const res = await fetch("https://lumo.proton.me/api/ai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.LUMO_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "auto",
    messages: [{ role: "user", content: "Hello" }],
  }),
});
console.log(await res.json());`,
        rust: `use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let res = client
        .post("https://lumo.proton.me/api/ai/v1/chat/completions")
        .header("Authorization", "Bearer " + std::env::var("LUMO_API_KEY")?)
        .header("Content-Type", "application/json")
        .json(&json!({
            "model": "auto",
            "messages": [{"role": "user", "content": "Hello"}]
        }))
        .send()
        .await?;
    println!("{}", res.text().await?);
    Ok(())
}`,
    },
};
