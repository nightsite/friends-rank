export type AnimePreset = {
  id: string;
  label: string;
  imageUrl: string;
};

export const ANIME_PRESETS: AnimePreset[] = [
  {
    id: "city-night",
    label: "Focus",
    imageUrl:
      "https://i.pinimg.com/736x/ca/cc/67/cacc674994275b6c37abf861d54e0674.jpg",
  },
  {
    id: "sunset-train",
    label: "Aura",
    imageUrl:
      "https://i.pinimg.com/originals/5d/2c/44/5d2c44694918947aede42306cb7154d0.gif",
  },
  {
    id: "neon-street",
    label: "Black Moon",
    imageUrl:
      "https://giffiles.alphacoders.com/221/221624.gif",
  },
  {
    id: "rainy-window",
    label: "Neon",
    imageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80",
  },
];

export function findPresetImage(presetId: string | null | undefined): string | null {
  if (!presetId) return null;
  return ANIME_PRESETS.find((p) => p.id === presetId)?.imageUrl ?? null;
}
