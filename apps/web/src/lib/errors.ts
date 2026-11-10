export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function apiError(status: number, code: string, message: string): ApiError {
  return new ApiError(status, code, message);
}

export function jsonErrorResponse(error: unknown): { status: number; body: { error: { code: string; message: string } } } {
  if (error instanceof ApiError) {
    return { status: error.status, body: { error: { code: error.code, message: error.message } } };
  }
  if (error instanceof Error) {
    return { status: 500, body: { error: { code: "internal_error", message: error.message } } };
  }
  return { status: 500, body: { error: { code: "internal_error", message: "unexpected error" } } };
}
