import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  runMonitoringRetention,
} from "../../../lib/monitoring-retention";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(
  request: NextRequest,
) {
  const cronSecret =
    process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        success: false,
        error:
          "CRON_SECRET is not configured.",
      },
      {
        status: 503,
      },
    );
  }

  const authorization =
    request.headers.get("authorization");

  if (
    authorization !==
    `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Unauthorized cron request.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const result =
      await runMonitoringRetention();

    return NextResponse.json({
      success: true,
      message:
        "Monitoring retention and aggregation completed.",
      result,
    });
  } catch (error) {
    console.error(
      "GET /api/cron/monitoring-retention error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Monitoring retention could not be completed.",
      },
      {
        status: 500,
      },
    );
  }
}
