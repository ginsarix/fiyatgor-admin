import { act, render, screen } from "@testing-library/react";
import { Toaster } from "sonner";
import { describe, expect, it } from "vitest";
import { showFirmSavedToast } from "./firm-saved-toast";

const toastOf = (text: string) =>
  screen.getByText(text).closest("[data-sonner-toast]");

describe("showFirmSavedToast", () => {
  it("confirms the save when there is no warning", async () => {
    render(<Toaster />);

    act(() => {
      showFirmSavedToast({
        title: "Firma güncellendi",
        description: "Firma bilgileriniz başarıyla kaydedildi.",
      });
    });

    await screen.findByText("Firma bilgileriniz başarıyla kaydedildi.");
    expect(
      toastOf("Firma bilgileriniz başarıyla kaydedildi."),
    ).not.toHaveAttribute("data-type", "warning");
  });

  // the firm was saved, but its new DIA credentials couldn't be checked
  it("shows the API's warning as a warning toast instead", async () => {
    render(<Toaster />);

    act(() => {
      showFirmSavedToast({
        title: "Firma güncellendi",
        description: "Firma bilgileriniz başarıyla kaydedildi.",
        warning: "DIA'ya ulaşılamadığı için DIA giriş bilgileri doğrulanamadı",
      });
    });

    await screen.findByText(
      "DIA'ya ulaşılamadığı için DIA giriş bilgileri doğrulanamadı",
    );
    expect(
      toastOf("DIA'ya ulaşılamadığı için DIA giriş bilgileri doğrulanamadı"),
    ).toHaveAttribute("data-type", "warning");
    expect(
      screen.queryByText("Firma bilgileriniz başarıyla kaydedildi."),
    ).not.toBeInTheDocument();
  });
});
