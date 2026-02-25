import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { axios } from "@/config/api";
import { firmsQueryKey } from "@/constants/queryKeys";
import {
  selectedFirmIdAtom,
  selectedFirmMutationModeAtom,
} from "@/state/atoms/firm";
import type { Firm } from "@/types/firm";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export default function FirmDeleteModal() {
  const [selectedFirmId, setSelectedFirmId] = useAtom(selectedFirmIdAtom);
  const [selectedFirmMutationMode, setSelectedFirmMutationMode] = useAtom(
    selectedFirmMutationModeAtom,
  );

  const queryClient = useQueryClient();

  const modalOpen = selectedFirmMutationMode === "delete";

  const deleteMutation = useMutation({
    mutationFn: async () =>
      await axios.delete<{ message: string }>(
        `/superadmin/firms/${selectedFirmId}`,
      ),
    onSuccess: () => {
      setSelectedFirmId(null);
      setSelectedFirmMutationMode(null);

      queryClient.setQueryData(
        [firmsQueryKey],
        (oldData: { message: string; firms: Firm[] }) => ({
          message: oldData.message,
          firms: oldData.firms.filter((firm) => firm.id !== selectedFirmId),
        }),
      );

      toast("Firma başarıyla silindi");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog
      open={modalOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedFirmId(null);
          setSelectedFirmMutationMode(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Firmayı Sil</DialogTitle>
          <DialogDescription>
            Bu firmayı silmek istediğinize emin misiniz?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setSelectedFirmMutationMode(null)}
          >
            İptal
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            onClick={() => deleteMutation.mutateAsync()}
          >
            Evet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
