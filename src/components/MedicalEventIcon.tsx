import { SvgXml } from "react-native-svg";
import type { MedicalEventType } from "@/types/domain";

// Vector versions of the event illustrations in assets/icons/events.
const eventIcons = {
  vaccination:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="305 98 380 380">\n<g fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">\n  <path d="m382 417-30 35m33-83-10 13c-9 12-6 25 4 32s22 4 31-4l22-16"/>\n  <path d="m481 206-96 116c-10 13-7 29 5 39l48 40c13 11 29 10 40-3l97-116c11-13 8-29-5-40l-48-39c-13-10-30-7-41 3Z"/>\n  <path d="m520 207 29-35m15 69 29-35m-62 77 26 22m-55 13 26 22m-56 13 26 22"/>\n  <path d="m539 165 64 47c10 8 24 6 31-4s5-23-5-31l-62-48c-10-8-24-5-31 5s-7 23 3 31Z"/>\n</g>\n</svg>\n',
  vet_visit:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="850 110 380 380">\n<g fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">\n  <path d="m1079 178-85 92c-24 25-23 43-38 71-13 25-30 40-55 66-11 12-11 26-1 35s24 7 35-4l29-28c24-24 47-30 72-38 19-6 31-16 45-30l87-83c27-27 26-65 3-88s-64-22-92 7Z"/>\n  <path d="m926 378 33 34"/>\n</g>\n<path fill="currentColor" d="m1068 244-51 51c-5 5-4 11 0 15l13 13c5 5 11 5 16 0l52-51c5-5 4-11 0-15l-13-13c-5-5-11-5-17 0Z"/>\n</svg>\n',
  analysis:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="315 562 380 380">\n<g fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">\n  <path d="M460 599h88c23 0 26 29 6 36-2 1-3 3-3 7v57c0 5 2 9 5 14l78 136c16 27-5 55-32 55H410c-29 0-49-27-35-53l78-140c2-4 3-8 3-13v-56c0-4-1-6-4-7-20-7-14-36 8-36Z"/>\n  <path d="M400 806c38-23 59-20 94-3 37 19 61 20 105-8"/>\n</g>\n<g fill="currentColor"><circle cx="453" cy="850" r="13"/><circle cx="489" cy="834" r="8"/><circle cx="516" cy="863" r="10"/></g>\n</svg>\n',
  procedure:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="854 575 380 380">\n<g fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">\n  <path d="m1064 641-146 146c-31 31-31 73-2 102s72 29 103-2l147-146c32-32 33-75 4-104s-74-23-106 4Z"/>\n  <path d="m965 734 43-43c12-12 26-10 37 1l71 71c11 11 13 24 1 36l-43 43c-12 12-26 10-37-1l-71-71c-11-11-13-24-1-36Z"/>\n</g>\n<g fill="currentColor"><circle cx="1107" cy="662" r="8.5"/><circle cx="1144" cy="670" r="8.5"/><circle cx="1099" cy="690" r="8.5"/><circle cx="1142" cy="708" r="8.5"/><circle cx="948" cy="816" r="8.5"/><circle cx="984" cy="837" r="8.5"/><circle cx="940" cy="854" r="8.5"/><circle cx="977" cy="871" r="8.5"/></g>\n</svg>\n',
} as const;

export function MedicalEventIcon({
  type,
  size = 20,
  color,
}: {
  type: MedicalEventType;
  size?: number;
  color: string;
}) {
  return (
    <SvgXml xml={eventIcons[type]} width={size} height={size} color={color} />
  );
}
