import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "./api-error";

function axiosErrorWithBody(status: number, data: unknown) {
  return new AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    { status, data, statusText: "", headers: {}, config: {} } as AxiosResponse,
  );
}

describe("apiErrorMessage", () => {
  it("shows the message the API answered with", () => {
    expect(
      apiErrorMessage(
        axiosErrorWithBody(422, { message: "DIA girişi başarısız oldu" }),
      ),
    ).toBe("DIA girişi başarısız oldu");
  });

  it("falls back to the error itself when the API sent no message", () => {
    expect(
      apiErrorMessage(
        axiosErrorWithBody(500, {
          error: "Internal server error",
          requestId: "abc",
        }),
      ),
    ).toBe("Request failed with status code 500");
  });

  it("falls back to the error itself when there is no response", () => {
    expect(apiErrorMessage(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(
      "Network Error",
    );
  });

  it("handles errors that aren't from axios", () => {
    expect(apiErrorMessage(new Error("boom"))).toBe("boom");
  });
});
