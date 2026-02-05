import type { BgaZoom as BgaZoomType } from "../bga-zoom";

const BgaZoom: typeof BgaZoomType = await globalThis.importEsmLib('bga-zoom', '1.0.0');

const [BgaHelp, BgaAnimations, BgaCards, BgaJumpTo] = await globalThis.importDojoLibs([
    g_gamethemeurl + "modules/js/bga-help.js",
    g_gamethemeurl + "modules/js/bga-animations.js",
    g_gamethemeurl + "modules/js/bga-cards.js",
    g_gamethemeurl + "modules/js/bga-jump-to.js",
]);

export { BgaZoom, BgaHelp, BgaAnimations, BgaCards, BgaJumpTo };