import { SvgXml } from "react-native-svg";
import type { ComponentProps } from "react";

type NavigationIconProps = {
  size?: number;
  color: ComponentProps<typeof SvgXml>["color"];
};

const homeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="195 140 425 425" fill="none">\n  <g stroke="currentColor" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M248 386h-13c-12 0-12-12-3-21l135-132c12-12 29-12 42 0l134 132c10 10 8 21-4 21h-13v108c0 26-20 46-46 46h-43c-4 0-6-3-6-7v-65c0-24-17-40-43-40s-44 16-44 40v65c0 4-2 7-6 7h-43c-27 0-47-20-47-46Z"/>\n    <path d="m485 197 11-33m31 61 29-29m1 70 32-10"/>\n  </g>\n</svg>\n';

export function HomeIcon({ size = 22, color }: NavigationIconProps) {
  return <SvgXml xml={homeSvg} width={size} height={size} color={color} />;
}

const profileSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="1470 170 425 425" fill="none">\n  <g stroke="currentColor" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">\n    <circle cx="1647" cy="301" r="85"/>\n    <path d="M1647 386c-69 0-121 46-140 102-10 29-2 55 31 55h218c33 0 41-26 31-55-19-56-71-102-140-102Z"/>\n    <path d="m1792 352 24-27m8 62 30-11"/>\n  </g>\n</svg>\n';

export function ProfileIcon({ size = 22, color }: NavigationIconProps) {
  return <SvgXml xml={profileSvg} width={size} height={size} color={color} />;
}
