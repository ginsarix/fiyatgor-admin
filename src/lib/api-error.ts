import { isAxiosError } from "axios";

// the API puts the user facing reason in `message`, axios' own message is only a fallback
export function apiErrorMessage(error: Error): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }

  return error.message;
}
