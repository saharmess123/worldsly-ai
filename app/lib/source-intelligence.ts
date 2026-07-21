import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 500_000;
const MAX_REDIRECTS = 3;
const MAX_EXTRACTED_CHARACTERS = 14_000;

export type RetrievedSourceContent = {
  text: string;
  finalUrl: string;
  contentType: string;
  fetchedAt: string;
  characterCount: number;
};

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some(
      (part) =>
        !Number.isInteger(part) ||
        part < 0 ||
        part > 255,
    )
  ) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 169 && second === 254) ||
    (first === 172 &&
      second >= 16 &&
      second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 &&
      second >= 64 &&
      second <= 127)
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);

  if (version === 4) {
    return isPrivateIpv4(address);
  }

  if (version === 6) {
    return isPrivateIpv6(address);
  }

  return false;
}

async function validatePublicUrl(
  rawUrl: string,
): Promise<URL> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error(
      "The source URL is not valid.",
    );
  }

  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error(
      "Only HTTP and HTTPS source URLs are supported.",
    );
  }

  if (
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new Error(
      "Source URLs containing credentials are not allowed.",
    );
  }

  const hostname =
    parsedUrl.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error(
      "Local-network source URLs are not allowed.",
    );
  }

  if (
    isIP(hostname) &&
    isPrivateAddress(hostname)
  ) {
    throw new Error(
      "Private-network source URLs are not allowed.",
    );
  }

  const resolvedAddresses =
    await lookup(hostname, {
      all: true,
      verbatim: true,
    });

  if (
    resolvedAddresses.length === 0 ||
    resolvedAddresses.some((item) =>
      isPrivateAddress(item.address),
    )
  ) {
    throw new Error(
      "The source URL resolves to a private or unavailable network address.",
    );
  }

  return parsedUrl;
}

function decodeHtmlEntities(
  value: string,
): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(
      /&#(\d+);/g,
      (_, code: string) =>
        String.fromCodePoint(Number(code)),
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, code: string) =>
        String.fromCodePoint(
          Number.parseInt(code, 16),
        ),
    );
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(
        /<(script|style|noscript|svg|canvas|template)\b[^>]*>[\s\S]*?<\/\1>/gi,
        " ",
      )
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(
        /<(br|hr)\s*\/?>/gi,
        "\n",
      )
      .replace(
        /<\/(p|div|section|article|header|footer|main|aside|nav|li|h[1-6]|tr)>/gi,
        "\n",
      )
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractReadableText(
  rawContent: string,
  contentType: string,
): string {
  const normalizedType =
    contentType.toLowerCase();

  let text = rawContent;

  if (
    normalizedType.includes("text/html") ||
    /<html[\s>]/i.test(rawContent)
  ) {
    text = htmlToText(rawContent);
  } else if (
    normalizedType.includes(
      "application/json",
    )
  ) {
    try {
      text = JSON.stringify(
        JSON.parse(rawContent),
        null,
        2,
      );
    } catch {
      text = rawContent;
    }
  } else {
    text = decodeHtmlEntities(rawContent)
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return text.slice(
    0,
    MAX_EXTRACTED_CHARACTERS,
  );
}

async function readLimitedResponse(
  response: Response,
): Promise<string> {
  if (!response.body) {
    return "";
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let totalBytes = 0;
  let content = "";

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (
      totalBytes >
      MAX_RESPONSE_BYTES
    ) {
      await reader.cancel();

      throw new Error(
        "The source response is too large to scan safely.",
      );
    }

    content += decoder.decode(value, {
      stream: true,
    });
  }

  content += decoder.decode();

  return content;
}

export async function retrieveSourceContent(
  rawUrl: string,
): Promise<RetrievedSourceContent> {
  let currentUrl =
    await validatePublicUrl(rawUrl);

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const controller =
      new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT_MS,
    );

    try {
      const response = await fetch(
        currentUrl,
        {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            Accept:
              "text/html,text/plain,application/json,application/xml,text/xml;q=0.9,*/*;q=0.5",
            "User-Agent":
              "WordslyAI-SourceScanner/1.0",
          },
          cache: "no-store",
        },
      );

      if (
        response.status >= 300 &&
        response.status < 400
      ) {
        const location =
          response.headers.get(
            "location",
          );

        if (!location) {
          throw new Error(
            "The source returned an invalid redirect.",
          );
        }

        currentUrl =
          await validatePublicUrl(
            new URL(
              location,
              currentUrl,
            ).toString(),
          );

        continue;
      }

      if (!response.ok) {
        throw new Error(
          `The source returned HTTP ${response.status}.`,
        );
      }

      const contentType =
        response.headers.get(
          "content-type",
        ) || "text/plain";

      const allowedContent =
        contentType.includes("text/") ||
        contentType.includes(
          "application/json",
        ) ||
        contentType.includes(
          "application/xml",
        );

      if (!allowedContent) {
        throw new Error(
          `Unsupported source content type: ${contentType}.`,
        );
      }

      const rawContent =
        await readLimitedResponse(
          response,
        );

      const text =
        extractReadableText(
          rawContent,
          contentType,
        );

      if (text.length < 80) {
        throw new Error(
          "The source did not provide enough readable content.",
        );
      }

      return {
        text,
        finalUrl:
          currentUrl.toString(),
        contentType,
        fetchedAt:
          new Date().toISOString(),
        characterCount:
          text.length,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new Error(
          "The source request timed out.",
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(
    "The source redirected too many times.",
  );
}