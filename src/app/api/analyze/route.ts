import { NextResponse } from "next/server";
import { z } from "zod";
import { pageAnalyzer } from "@/services/page-analyzer";
import { PageAnalysisResult } from "@/types/analysis";
import logger from "@/utils/logger";
import { normalizeAppError } from "@/utils/errors";

const analyzeSchema = z.object({
  url: z.string().url({ message: "Invalid URL format" }),
  forceFresh: z.boolean().optional(),
});

// TODO: Puppeteer cannot be used in serverless environment due to serverless limitations

export async function POST(request: Request) {
  logger.debug("Received request to /api/analyze");
  try {
    const body = await request.json();
    const validation = analyzeSchema.safeParse(body);

    if (!validation.success) {
      logger.warn("Invalid request body for /api/analyze", {
        errors: validation.error.flatten().fieldErrors,
      });
      return NextResponse.json(
        { error: "Invalid URL provided", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { url, forceFresh = false } = validation.data;
    logger.log(`Analyzing URL: ${url} (forceFresh: ${forceFresh})`);

    const result: PageAnalysisResult = await pageAnalyzer.analyzeUrl(
      url,
      forceFresh
    );

    logger.debug("Analysis result", { url, result });
    return NextResponse.json(result);
  } catch (error) {
    const normalizedError = normalizeAppError(error);
    logger.error("Error in /api/analyze", {
      message: normalizedError.message,
      stack: normalizedError.stack,
    });
    return NextResponse.json(
      { error: "Failed to analyze URL", details: normalizedError.message },
      { status: 500 }
    );
  }
}
