

export type Severity = "neutral" | "success" | "warning" | "error";

export interface FormattedActivity {
    agentLabel: string;
    plainText: string;
    detailText: string;
    severity: Severity;
    categoryLabel: string;
}

export function formatActivityEvent(
    event: Record<string, unknown>,
    agentNameById: Record<string, string>
): FormattedActivity {
    const agentId = (event.agentId as string) || "system";
    const agentLabel = agentNameById[agentId] || agentId;
    const rawMessage = typeof event.message === "string" ? event.message : "";
    const detailText = rawMessage;
    const metadata = (event.metadata as Record<string, unknown>) || {};
    const role = metadata.role as string | undefined;
    const toolCalls = metadata.toolCalls as Array<{ name?: string }> | undefined;

    let plainText = "";
    let severity: Severity = "neutral";
    let categoryLabel = "Activity";

    // Clean prefixes and envelopes from raw message for fallback
    const cleanedMessage = rawMessage
        .replace(/^(User|Assistant|Tool|System):\s*/i, "")
        .replace(/^\[telegram.*?\]\s*/i, "")
        .trim();

    // Severity rules
    if (/error|failed|fail|blocked/i.test(rawMessage)) {
        severity = "error";
    } else if (/done|complete|completed|finished|success/i.test(rawMessage)) {
        severity = "success";
    } else {
        severity = "neutral";
    }

    // Priority rules for plain text
    if (role === "assistant" && /done|complete|completed|finished/i.test(rawMessage)) {
        plainText = "completed the task";
    } else if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
        const names = toolCalls.map((t) => t.name).filter(Boolean).join(", ");
        plainText = `is working using ${names}`;
    } else if (role === "tool") {
        plainText = "finished a tool step";
    } else if (role === "user" && /\[telegram/i.test(rawMessage)) {
        plainText = "sent a Telegram request";
    } else if (role === "assistant") {
        plainText = "shared an update";
    } else if (role === "user") {
        plainText = "sent a message";
    } else {
        // Fallback: cleaned message
        plainText = cleanedMessage;
        // Replace phrases
        plainText = plainText.replace(/Invoked tool\s+([\w-]+)/i, "started tool $1");
        plainText = plainText.replace(/Tool result from\s+([\w-]+)/i, "finished tool $1");

        // Cap sentence length for readability if it's too long
        if (plainText.length > 100) {
            plainText = plainText.substring(0, 97) + "...";
        }

        if (!plainText) {
            plainText = "performed an action";
        }
    }

    // categoryLabel
    if (event.type === "comment") categoryLabel = "Comment";
    else if (event.type === "status_change") categoryLabel = "Status Update";
    else if (event.type === "decision") categoryLabel = "Decision";
    else categoryLabel = "Activity";

    return {
        agentLabel,
        plainText,
        detailText,
        severity,
        categoryLabel,
    };
}
