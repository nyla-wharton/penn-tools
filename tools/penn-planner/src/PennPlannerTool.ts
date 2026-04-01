import { Tool } from "@penntools/core/tools";
import type { ToolManifest } from "@penntools/core/tools";
import type { ToolContext } from "@penntools/core/tools";
import type { PennPlannerInput, PennPlannerOutput } from "./types.js";

export class PennPlannerTool extends Tool<PennPlannerInput, PennPlannerOutput> {
  readonly manifest: ToolManifest = {
    id: "penn-planner",
    title: "Penn Planner",
    description: "AI academic & recruiting planner — tasks from Canvas and CareerPath.",
    image: "/tools/penn-planner/icon.svg",
    contributors: ["Team 3"],
    mentor: undefined,
    version: "0.1.0",
    inceptionDate: "2026-03-31",
    latestReleaseDate: "2026-03-31",
  };

  async execute(input: PennPlannerInput, context: ToolContext): Promise<PennPlannerOutput> {
    const llmResponse = await context.llm.complete({
      messages: [
        {
          role: "user",
          content: `You are Penn Planner, a concise academic and recruiting assistant. User request: ${input.prompt}`,
        },
      ],
    });

    return {
      assistantMessage: llmResponse.content,
      telemetry: {
        durationMs: 0,
        tokensUsed: llmResponse.usage.totalTokens,
      },
    };
  }
}
