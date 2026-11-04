/** Maximum OnePay callback size. The documented payload contains only a few fields. */
export const MAX_ONEPAY_CALLBACK_BYTES = 8 * 1024;

export type OnePayCallback = {
  transaction_id: string;
  status?: number;
  status_message?: string;
  additional_data?: string;
};

export type ReadCallbackResult =
  | { ok: true; callback: OnePayCallback }
  | { ok: false; status: 400 | 413 | 415 };

/** Reads and validates a callback without buffering an unbounded request body. */
export async function readOnePayCallback(request: Request): Promise<ReadCallbackResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, status: 415 };

  const length = request.headers.get("content-length");
  if (length !== null) {
    if (!/^\d+$/.test(length)) return { ok: false, status: 400 };
    if (Number(length) > MAX_ONEPAY_CALLBACK_BYTES) return { ok: false, status: 413 };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400 };

  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_ONEPAY_CALLBACK_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return { ok: false, status: 400 };
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, status: 400 };
  }

  const body = value as Record<string, unknown>;
  if (typeof body.transaction_id !== "string" || !/^[A-Za-z0-9_-]{6,64}$/.test(body.transaction_id)) {
    return { ok: false, status: 400 };
  }
  if (body.status !== undefined && (typeof body.status !== "number" || !Number.isFinite(body.status))) {
    return { ok: false, status: 400 };
  }
  if (body.status_message !== undefined && typeof body.status_message !== "string") {
    return { ok: false, status: 400 };
  }
  if (body.additional_data !== undefined && typeof body.additional_data !== "string") {
    return { ok: false, status: 400 };
  }

  return {
    ok: true,
    callback: {
      transaction_id: body.transaction_id,
      ...(body.status !== undefined && { status: body.status }),
      ...(body.status_message !== undefined && { status_message: body.status_message }),
      ...(body.additional_data !== undefined && { additional_data: body.additional_data }),
    },
  };
}
