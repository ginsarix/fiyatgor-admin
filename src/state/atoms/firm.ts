import { atom } from "jotai";

export const selectedFirmIdAtom = atom<number | null>(null);
export const selectedFirmMutationModeAtom = atom<"update" | "delete" | null>(
  null,
);
