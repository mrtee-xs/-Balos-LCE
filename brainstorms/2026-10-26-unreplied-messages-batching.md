# Multi-Message & Unreplied Inbound Message Handling: Brainstorm / Discovery Notes
Date: 2026-10-26 · Goal: Define the exact architecture and conversational behavior for handling multiple consecutive or unreplied inbound WhatsApp messages in Balos Lead Conversion Engine
Status: complete
Context sources: n8n workflow 50f6kWEBDz7rIgYR, WAHA Gateway, Supabase `messages` & `leads` tables

## Summary / key decisions
- **Decision 1 (Message Aggregation Pattern)**: Adopted **Smart Buffer & Merge (Debounce 6s)**. When rapid-fire bubbles arrive from a lead, wait a brief window for the buyer to finish typing, aggregate all unreplied incoming messages into a single coherent prompt, and dispatch one comprehensive, high-converting WhatsApp response.
- **Decision 2 (Persistence & Buffer Storage)**: Adopted **Immediate DB Persistence + Batch Query**. Every incoming message bubble is logged to Supabase `messages` table immediately upon arrival (guaranteeing real-time updates on the agent's web inbox and zero message loss). A 6-second debounce window allows subsequent bubbles to accumulate, after which all unreplied messages since the last outbound reply are queried and aggregated into the AI prompt.
- **Decision 3 (Concurrency Control & Debounce Winner Election)**: Adopted **Latest-Message Lock in n8n**. Each incoming webhook execution logs its message to Supabase and records its `message_id` on the lead (or checks the latest message ID in Supabase) after a 6-second wait. If newer messages arrived during the wait (`my_message_id !== latest_message_id`), older executions exit silently. Only the final/latest execution proceeds to gather all unreplied bubbles, run the AI Agent, and dispatch the single unified reply.
- **Decision 4 (Response Delivery & Tone)**: Adopted **Single Cohesive WhatsApp Message**. The AI synthesizes all questions from the combined batch into one unified, elegantly structured Dubai broker reply with clean line breaks, emojis, and property/viewing recommendations, avoiding notification noise.
- **Decision 5 (Debounce Window Duration)**: Locked at **6 Seconds** as the optimal balance between allowing human typing cadence across multiple bubbles and preserving sub-15 second response velocity.

## Q&A log
### Q1 - Inbound Message Aggregation & Reply Strategy
- Asked: When a buyer sends multiple WhatsApp messages in separate bubbles before the AI responds, how should Balos process and reply to them?
- Captured: User chose **Smart Buffer & Merge (Debounce 5–8s)**: Wait a few seconds for rapid-fire bubbles to settle, combine all unreplied messages into one unified prompt, and send a single cohesive reply.
- Tentative / suggested: Suggested 5–8 second debounce window to match natural human WhatsApp typing cadence.
- Flags: None.

### Q2 - Message Persistence & Buffer Architecture
- Asked: Where and how should the incoming message buffer be stored while waiting for the lead to finish typing?
- Captured: User chose **Immediate DB Persistence + Batch Query**: Log every incoming bubble to Supabase immediately (so the broker dashboard updates in real-time), wait 6s for the buyer to finish typing, then gather all unreplied bubbles into one prompt.
- Tentative / suggested: Use the existing Supabase `messages` table with an unreplied check relative to the latest outbound message timestamp.
- Flags: None.

### Q3 - Concurrency Control & Latest-Message Lock
- Asked: How should we handle concurrent webhooks so only ONE AI reply is sent for the entire batch of messages?
- Captured: User chose **Latest-Message Lock in n8n**: Each execution logs its message and waits 6s, then checks if newer messages arrived. Older executions exit quietly; only the latest execution gathers all unreplied messages and triggers the AI reply.
- Tentative / suggested: Check the newest `id` or `created_at` in `messages` where `lead_id = lead.id AND direction = 'INBOUND'`. If the execution's message is not the latest, terminate the branch without sending a reply.
- Flags: None.

### Q4 - Response Delivery & Message Presentation
- Asked: How should the AI deliver its response back to the buyer on WhatsApp?
- Captured: User chose **Single Cohesive WhatsApp Message**: Acknowledge and answer all combined questions in one beautifully formatted, luxury broker reply with clean linebreaks and emojis.
- Tentative / suggested: The AI prompt explicitly instructs the LLM to address all aspects of the multi-bubble batch in a single flowing reply.
- Flags: None.

### Q5 - Debounce Window Duration
- Asked: What should be the exact debounce wait window before the AI starts generating its reply?
- Captured: User chose **6 Seconds**: Optimal balance between giving the buyer enough time to send follow-up thoughts and maintaining a fast, high-converting response time.
- Tentative / suggested: 6s debounce delay node in n8n workflow.
- Flags: None.

## Open flags (pending input)
