import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment (.env.local).
export const anthropic = new Anthropic();
