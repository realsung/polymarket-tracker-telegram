import type { Trade } from "../types/index.js";
interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
    footer?: {
        text: string;
    };
    timestamp?: string;
}
export declare function formatDiscordEmbed(trade: Trade, label?: string): DiscordEmbed;
export declare function sendDiscordWebhook(webhookUrl: string, trade: Trade, label?: string): Promise<void>;
export {};
