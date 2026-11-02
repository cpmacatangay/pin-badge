import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { findBadgePreset } from "../lib/presets";
import {
  DEFAULT_BACKGROUND,
  DEFAULT_GUIDES,
  DEFAULT_LAYOUT,
  DEFAULT_PAGE,
  DEFAULT_SETTINGS,
  DEFAULT_TRANSFORM,
} from "../lib/presets";
import { releaseArtwork } from "../lib/image";
import type {
  Artwork,
  BadgePresetId,
  BadgeSetup,
  Guides,
  PageSetup,
  SheetLayout,
  StudioSettings,
  Transform,
} from "../lib/types";

interface StudioStore extends StudioSettings {
  artwork: Artwork | null;
  exporting: boolean;
  exportError: string | null;
  selectPreset: (id: BadgePresetId) => void;
  setBadgeField: <K extends keyof BadgeSetup>(field: K, value: BadgeSetup[K]) => void;
  resetBadge: () => void;
  setPageField: <K extends keyof PageSetup>(field: K, value: PageSetup[K]) => void;
  setLayoutField: <K extends keyof SheetLayout>(field: K, value: SheetLayout[K]) => void;
  setGuide: <K extends keyof Guides>(field: K, value: Guides[K]) => void;
  setTransform: (patch: Partial<Transform>) => void;
  resetTransform: () => void;
  setBackground: (value: string) => void;
  setArtwork: (artwork: Artwork | null) => void;
  clearArtwork: () => void;
  setExporting: (value: boolean) => void;
  setExportError: (message: string | null) => void;
}

const initialSettings: StudioSettings = {
  badge: { ...DEFAULT_SETTINGS.badge },
  page: { ...DEFAULT_SETTINGS.page },
  layout: { ...DEFAULT_SETTINGS.layout },
  guides: { ...DEFAULT_SETTINGS.guides },
  transform: { ...DEFAULT_SETTINGS.transform },
  background: DEFAULT_SETTINGS.background,
};

export const useStudio = create<StudioStore>()(
  persist(
    (set) => ({
      ...initialSettings,
      artwork: null,
      exporting: false,
      exportError: null,

      selectPreset: (id) => {
        const preset = findBadgePreset(id);
        if (!preset) return;
        set((state) => ({
          badge: {
            ...state.badge,
            presetId: id,
            faceMm: preset.faceMm,
            cutMm: preset.cutMm,
          },
        }));
      },

      setBadgeField: (field, value) =>
        set((state) => ({ badge: { ...state.badge, [field]: value } })),

      resetBadge: () =>
        set((state) => {
          const preset = findBadgePreset(state.badge.presetId);
          if (!preset) return {};
          return {
            badge: {
              ...state.badge,
              faceMm: preset.faceMm,
              cutMm: preset.cutMm,
              safeInsetMm: DEFAULT_SETTINGS.badge.safeInsetMm,
            },
          };
        }),

      setPageField: (field, value) =>
        set((state) => ({ page: { ...state.page, [field]: value } })),

      setLayoutField: (field, value) =>
        set((state) => ({ layout: { ...state.layout, [field]: value } })),

      setGuide: (field, value) =>
        set((state) => ({ guides: { ...state.guides, [field]: value } })),

      setTransform: (patch) =>
        set((state) => ({ transform: { ...state.transform, ...patch } })),

      resetTransform: () => set({ transform: { ...DEFAULT_TRANSFORM } }),

      setBackground: (value) => set({ background: value }),

      setArtwork: (artwork) =>
        set((state) => {
          if (state.artwork && state.artwork !== artwork) {
            releaseArtwork(state.artwork);
          }
          return { artwork, exportError: null };
        }),

      clearArtwork: () =>
        set((state) => {
          releaseArtwork(state.artwork);
          return { artwork: null, exportError: null };
        }),

      setExporting: (value) => set({ exporting: value }),

      setExportError: (message) => set({ exportError: message }),
    }),
    {
      name: "pin-badge-studio/v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        badge: state.badge,
        page: state.page,
        layout: state.layout,
        guides: state.guides,
        transform: state.transform,
        background: state.background,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<StudioSettings>;
        return {
          ...current,
          badge: { ...DEFAULT_SETTINGS.badge, ...saved.badge },
          page: { ...DEFAULT_SETTINGS.page, ...saved.page },
          layout: { ...DEFAULT_SETTINGS.layout, ...saved.layout },
          guides: { ...DEFAULT_GUIDES, ...saved.guides },
          transform: { ...DEFAULT_TRANSFORM, ...saved.transform },
          background: saved.background ?? DEFAULT_BACKGROUND,
        };
      },
    },
  ),
);

export function resetAllSettings(): void {
  useStudio.setState({
    ...initialSettings,
    badge: { ...DEFAULT_SETTINGS.badge },
    page: { ...DEFAULT_PAGE },
    layout: { ...DEFAULT_LAYOUT },
    guides: { ...DEFAULT_GUIDES },
    transform: { ...DEFAULT_TRANSFORM },
    background: DEFAULT_BACKGROUND,
    exportError: null,
  });
}
