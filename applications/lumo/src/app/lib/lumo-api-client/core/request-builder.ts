import {
    type AesGcmCryptoKey,
    type AssistantCallOptions,
    type ChunkCallback,
    type FinishCallback,
    type RequestId,
    Role,
    type Turn,
} from './types';

/**
 * Fluent API for building and executing LLM requests
 */
export class RequestBuilder {
    private turns: Turn[] = [];

    private options: Partial<AssistantCallOptions> = {};

    private timeout?: number;

    private timeoutController?: AbortController;

    /**
     * Add a message to the conversation
     * @param content Message content
     * @param role Message role (defaults to 'user')
     * @returns RequestBuilder for chaining
     */
    addMessage(content: string, role: Role = Role.User): RequestBuilder {
        this.turns.push({ role, content });
        return this;
    }

    /**
     * Add a user message
     * @param content User message content
     * @returns RequestBuilder for chaining
     */
    user(content: string): RequestBuilder {
        return this.addMessage(content, Role.User);
    }

    /**
     * Add an assistant message (for conversation context)
     * @param content Assistant message content
     * @returns RequestBuilder for chaining
     */
    assistant(content: string): RequestBuilder {
        return this.addMessage(content, Role.Assistant);
    }

    /**
     * Add a system message
     * @param content System message content
     * @returns RequestBuilder for chaining
     */
    system(content: string): RequestBuilder {
        return this.addMessage(content, Role.System);
    }

    /**
     * Add multiple turns from an array
     * @param turns Array of conversation turns
     * @returns RequestBuilder for chaining
     */
    addTurns(turns: Turn[]): RequestBuilder {
        this.turns.push(...turns);
        return this;
    }

    // todo: api users likely want a default mode with no tools, not even the internal ones (proton_info).
    //       we should give them the ability to use either of:
    //       - no tools / default
    //       - internal tools (proton_info)
    //       - all tools: internal + external (web search, etc)

    // todo: the todo above is even more relevant with image generation: api users likely don't want imgen

    /**
     * Enable or disable external tools (web search, weather, etc.)
     * @param enabled Whether to enable external tools
     * @returns RequestBuilder for chaining
     */
    withExternalTools(enabled: boolean = true): RequestBuilder {
        this.options.enableExternalTools = enabled;
        return this;
    }

    /**
     * Enable web search and other external tools
     * @returns RequestBuilder for chaining
     */
    withWebSearch(): RequestBuilder {
        return this.withExternalTools(true);
    }

    /**
     * Request title generation for new conversations
     * @param enabled Whether to request title generation
     * @returns RequestBuilder for chaining
     */
    withTitle(enabled: boolean = true): RequestBuilder {
        this.options.generateTitle = enabled;
        return this;
    }

    /**
     * Set abort signal for cancellation
     * @param signal AbortSignal for request cancellation
     * @returns RequestBuilder for chaining
     */
    withSignal(signal: AbortSignal): RequestBuilder {
        this.options.signal = signal;
        return this;
    }

    /**
     * Set request timeout in milliseconds
     * @param ms Timeout in milliseconds
     * @returns RequestBuilder for chaining
     */
    withTimeout(ms: number): RequestBuilder {
        this.timeout = ms;
        return this;
    }

    /**
     * Set chunk callback for streaming responses
     * @param callback Function to handle streaming chunks
     * @returns RequestBuilder for chaining
     */
    onChunk(callback: ChunkCallback): RequestBuilder {
        this.options.chunkCallback = callback;
        return this;
    }

    /**
     * Set finish callback for request completion
     * @param callback Function to handle request completion
     * @returns RequestBuilder for chaining
     */
    onFinish(callback: FinishCallback): RequestBuilder {
        this.options.finishCallback = callback;
        return this;
    }

    /**
     * Set encryption keys manually
     * @param requestKey AES-GCM encryption key
     * @param requestId Request ID for encryption
     * @returns RequestBuilder for chaining
     */
    withEncryption(requestKey: AesGcmCryptoKey, requestId: RequestId): RequestBuilder {
        this.options.requestKey = requestKey;
        this.options.requestId = requestId;
        this.options.autoGenerateEncryption = false;
        return this;
    }

    /**
     * Enable auto-generation of encryption keys
     * @param enabled Whether to auto-generate encryption keys
     * @returns RequestBuilder for chaining
     */
    withAutoEncryption(enabled: boolean = true): RequestBuilder {
        this.options.autoGenerateEncryption = enabled;
        return this;
    }

    /**
     * Disable encryption entirely
     * @returns RequestBuilder for chaining
     */
    withoutEncryption(): RequestBuilder {
        this.options.autoGenerateEncryption = false;
        return this;
    }

    /**
     * Execute the request using the provided client
     * @param execute Function to execute the request (typically client.callAssistant)
     * @returns Promise that resolves when the request completes
     */
    async execute(execute: (turns: Turn[], options: AssistantCallOptions) => Promise<void>): Promise<void> {
        // Setup timeout if specified
        if (this.timeout && !this.options.signal) {
            this.timeoutController = new AbortController();
            this.options.signal = this.timeoutController.signal;
            setTimeout(() => this.timeoutController?.abort(), this.timeout);
        }

        try {
            await execute(this.turns, this.options as AssistantCallOptions);
        } finally {
            // Cleanup timeout controller
            if (this.timeoutController) {
                this.timeoutController.abort();
                this.timeoutController = undefined;
            }
        }
    }

    /**
     * Execute a quick chat request (single user message)
     * @param execute Function to execute the request
     * @returns Promise that resolves with the response content
     */
    async quickExecute(execute: (turns: Turn[], options: AssistantCallOptions) => Promise<string>): Promise<string> {
        // Setup timeout if specified
        if (this.timeout && !this.options.signal) {
            this.timeoutController = new AbortController();
            this.options.signal = this.timeoutController.signal;
            setTimeout(() => this.timeoutController?.abort(), this.timeout);
        }

        try {
            return await execute(this.turns, this.options as AssistantCallOptions);
        } finally {
            // Cleanup timeout controller
            if (this.timeoutController) {
                this.timeoutController.abort();
                this.timeoutController = undefined;
            }
        }
    }

    /**
     * Get the current conversation turns
     * @returns Array of conversation turns
     */
    getTurns(): Turn[] {
        return [...this.turns];
    }

    /**
     * Get the current options
     * @returns Current request options
     */
    getOptions(): Partial<AssistantCallOptions> {
        return { ...this.options };
    }

    /**
     * Clear all turns and options
     * @returns RequestBuilder for chaining
     */
    clear(): RequestBuilder {
        this.turns = [];
        this.options = {};
        this.timeout = undefined;
        return this;
    }

    /**
     * Clone the current builder
     * @returns New RequestBuilder with the same turns and options
     */
    clone(): RequestBuilder {
        const clone = new RequestBuilder();
        clone.turns = [...this.turns];
        clone.options = { ...this.options };
        clone.timeout = this.timeout;
        return clone;
    }
}
