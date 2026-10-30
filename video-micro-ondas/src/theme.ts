import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Montserrat (OFL) servida de public/fonts: o render não depende de baixar fontes da internet.
export const FONT = "Montserrat";
loadFont({ family: FONT, url: staticFile("fonts/montserrat-latin.woff2"), weight: "100 900", format: "woff2", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" });
loadFont({ family: FONT, url: staticFile("fonts/montserrat-latin-ext.woff2"), weight: "100 900", format: "woff2", unicodeRange: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" });

export const PALETTE = {
  // Estados didáticos (sempre com ícone + texto, nunca só cor)
  positive: "#20b85a",
  negative: "#e5383b",
  info: "#2f7df6",
  warning: "#f8c815",
  // Interface
  text: "#ffffff",
  outline: "#0a1420",
  accent: "#53d6ff",
  // Mundo: restaurante em corte
  floor: "#c98b55",
  floorEdge: "#8a5a35",
  kitchenFloor: "#dfe6e8",
  kitchenTile: "#c5d0d4",
  wall: "#f3e6cf",
  wallKitchen: "#e9eef0",
  trim: "#7a4a2a",
  pedestal: "#3a2a22",
  wood: "#a4683c",
  woodDark: "#6e4325",
  cloth: "#8e2b3a",
  plate: "#fbfbf7",
  steel: "#aeb6bd",
  gold: "#f2b631",
  goldDark: "#c98a12",
  cash: "#7fcf8a",
  paper: "#fffdf6",
  skin: "#e7b48a",
  skin2: "#b97d55",
  skin3: "#8a5a3c",
  hair: "#3b2a20",
} as const;

/** Acabamento levemente fosco para todo o diorama. */
export const MATTE = { roughness: 0.88, metalness: 0, flatShading: true } as const;
export const METAL = { roughness: 0.38, metalness: 0.55, flatShading: true } as const;

export const LIGHTING = {
  ambient: 0.55,
  hemisphere: { sky: "#fff1de", ground: "#6b5040", intensity: 1.0 },
  key: { position: [9, 16, 12] as [number, number, number], intensity: 2.5, color: "#fff4e2" },
  fill: { position: [-12, 6, 8] as [number, number, number], intensity: 0.75, color: "#cfe6ff" },
  rim: { position: [-4, 8, -12] as [number, number, number], intensity: 0.6, color: "#ffffff" },
  shadowMapSize: 2048,
} as const;

/** Perspectiva suave: FOV baixo e câmera afastada preservam a leitura do esquema. */
export const CAMERA = { fov: 24, near: 0.5, far: 400 } as const;

/** Faixas seguras para Shorts/Reels (px numa tela 1080x1920). */
export const SAFE = {
  top: 250,
  bottom: 1540,
  side: 90,
  badgeTop: 262,
  captionCenterY: 1418,
} as const;

/** Fundo: céu com a câmera acima do "chão", azul profundo quando ela desce (ver Background.tsx). */
/** Fundo quente de bistrô que escurece levemente até o fim (anoitecer). */
/** Fundo azul-gelo que esquenta levemente para creme no fim. */
/** Fundo quente de cozinha (creme → pêssego). */
export const SKY = {
  start: ["#ffe9cf", "#fff4e6", "#fffaf2"],
  end: ["#ffd9b8", "#ffe9d6", "#fff3e6"],
} as const;

/** Cores das palavras-chave nas legendas (as demais palavras ficam brancas). */
export const KEYWORD_COLOR: Record<string, string> = {
  QUEIMA: PALETTE.negative,
  GELADO: "#4fdcff",
  FRIOS: "#4fdcff",
  PROBLEMA: PALETTE.negative,
  ESCAPARIAM: PALETTE.negative,
  CALOR: "#ff9a3c",
  ÁGUA: "#4fdcff",
  "MICRO-ONDAS": PALETTE.positive,
  MAGNETRON: PALETTE.positive,
  METAL: PALETTE.positive,
  TELA: PALETTE.positive,
  GIRA: PALETTE.positive,
  PONTO: PALETTE.positive,
};
export const KEYWORD_DEFAULT = "#4fdcff";
