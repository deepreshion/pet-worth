import { SvgXml } from "react-native-svg";
import type { ComponentProps } from "react";

// Vector version of the supplied pet cards icon; standalone asset: assets/icons/pet-cards.svg.
const petCardsSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="185 252 883 736" fill="none">\n  <g stroke="currentColor" stroke-width="38" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M390 390c0-54 37-98 86-98h451c57 0 101 45 101 104v306c0 49-25 78-62 83"/>\n    <path d="M299 484c0-52 39-92 91-92h474c57 0 102 44 102 103v294c0 45-24 74-60 79"/>\n    <rect x="225" y="485" width="680" height="462" rx="94"/>\n  </g>\n  <g stroke="currentColor" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M328 698c-6-38 7-98 31-118 16-1 40 21 55 39 20-7 41-9 61-8 15-24 32-44 49-52 19 12 42 62 52 115"/>\n    <path d="M354 763l12 11c-28 33-44 66-43 96m240-130-12 21c20 31 28 72 25 109"/>\n    <path d="M296 708c14-6 28-8 43-6m-30 46c11-7 23-12 35-14m221-55c12-5 25-7 39-5m-38 38c12-1 24 0 35 3"/>\n  </g>\n  <g fill="currentColor">\n    <ellipse cx="396" cy="685" rx="15" ry="20" transform="rotate(-7 396 685)"/>\n    <ellipse cx="512" cy="672" rx="15" ry="20" transform="rotate(4 512 672)"/>\n    <path d="M441 685c7-5 23-6 30-3 10 4-2 19-10 27-4 5-8 4-12 0-9-9-17-19-8-24Z"/>\n    <rect x="642" y="650" width="206" height="46" rx="23"/>\n    <rect x="640" y="742" width="151" height="46" rx="23"/>\n  </g>\n</svg>\n';

export function PetCardsIcon({
  size = 22,
  color,
}: {
  size?: number;
  color: ComponentProps<typeof SvgXml>["color"];
}) {
  return <SvgXml xml={petCardsSvg} width={size} height={size} color={color} />;
}
