export type AnimePreset = {
  id: string;
  label: string;
  imageUrl: string;
};

export const ANIME_PRESETS: AnimePreset[] = [
  {
    id: "city-night",
    label: "City Night",
    imageUrl:
      "https://i.pinimg.com/736x/ca/cc/67/cacc674994275b6c37abf861d54e0674.jpg",
  },
  {
    id: "sunset-train",
    label: "Sunset Train",
    imageUrl:
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "neon-street",
    label: "Neon Street",
    imageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "rainy-window",
    label: "Rainy Window",
    imageUrl:
      "https://images.unsplash.com/photo-1498979237642-92f7a0f7a3c2?auto=format&fit=crop&w=1600&q=80",
  },
];

export function findPresetImage(presetId: string | null | undefined): string | null {
  if (!presetId) return null;
  return ANIME_PRESETS.find((p) => p.id === presetId)?.imageUrl ?? null;
}
