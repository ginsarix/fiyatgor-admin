import { atom } from "jotai";
import type { Session } from "@/types/session";

export const sessionAtom = atom<Session | null>(null);
