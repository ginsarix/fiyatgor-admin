import { toast } from "sonner";

/**
 * @param warning set by the API when the firm was saved but something still needs attention,
 * e.g. DIA couldn't be reached to verify the new DIA credentials
 */
export function showFirmSavedToast({
  title,
  description,
  warning,
}: {
  title: string;
  description: string;
  warning?: string;
}) {
  if (warning) {
    toast.warning(title, { description: warning });
    return;
  }

  toast(title, { description });
}
