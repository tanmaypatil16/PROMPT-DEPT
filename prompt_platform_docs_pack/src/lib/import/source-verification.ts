import { createHash } from "node:crypto";

export const TRUSTED_SOURCE_REPOSITORIES = ["im-286/siteprompt", "liuxin2533/awesome-image-prompts"] as const;
export const TRUSTED_SOURCE_REPOSITORY = TRUSTED_SOURCE_REPOSITORIES[0];
export const MAX_SOURCE_FILE_BYTES = 5 * 1024 * 1024;

export type SourceReference = {
  sourceRepository: string;
  sourcePath: string;
  sourceCommit: string;
};

export type VerifiedSource = SourceReference & {
  sourceIdentity: string;
  sourceContentHash: string;
};

export function validateSourceReference(reference: SourceReference): string | null {
  if (!TRUSTED_SOURCE_REPOSITORIES.includes(reference.sourceRepository as typeof TRUSTED_SOURCE_REPOSITORIES[number])) {
    return `Only ${TRUSTED_SOURCE_REPOSITORIES.join(" or ")} are supported for source review.`;
  }

  if (!/^[a-f0-9]{40}$/i.test(reference.sourceCommit)) {
    return "A full 40-character Git commit SHA is required.";
  }

  const pathSegments = reference.sourcePath.split("/");
  const sitePromptPath = ["prompts", "Pro-prompts"].includes(pathSegments[0]);
  const imagePromptPath = reference.sourceRepository === "liuxin2533/awesome-image-prompts" && reference.sourcePath === "docs/poster-illustration.md";
  if (
    pathSegments.length < 2
    || (!sitePromptPath && !imagePromptPath)
    || pathSegments.some((segment) =>
      !segment
      || segment === "."
      || segment === ".."
      || !/^[A-Za-z0-9._-]+$/.test(segment)
    )
    || !reference.sourcePath.toLowerCase().endsWith(".md")
  ) {
    return "Source path must be an approved Markdown prompt file in the configured repository.";
  }

  return null;
}

export function getSourceIdentity(sourceRepository: string, sourcePath: string): string {
  return `${sourceRepository}:${sourcePath}`;
}

export async function fetchVerifiedSource(reference: SourceReference): Promise<VerifiedSource> {
  const validationError = validateSourceReference(reference);
  if (validationError) throw new Error(validationError);

  const normalizedReference = { ...reference, sourceCommit: reference.sourceCommit.toLowerCase() };
  const encodedPath = normalizedReference.sourcePath.split("/").map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${normalizedReference.sourceRepository}/${normalizedReference.sourceCommit}/${encodedPath}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "error",
      cache: "no-store",
      headers: { Accept: "text/plain" },
    });
    if (!response.ok) throw new Error(`Source fetch failed with status ${response.status}.`);

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_SOURCE_FILE_BYTES) throw new Error("Source file exceeds the maximum size.");

    if (!response.body) throw new Error("Source response did not contain a body.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_SOURCE_FILE_BYTES) {
          await reader.cancel();
          throw new Error("Source file exceeds the maximum size.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const contentBytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      contentBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return {
      ...normalizedReference,
      sourceIdentity: getSourceIdentity(normalizedReference.sourceRepository, normalizedReference.sourcePath),
      sourceContentHash: createHash("sha256").update(contentBytes).digest("hex"),
    };
  } finally {
    clearTimeout(timeout);
  }
}
