import type { ModeLanguage } from './modeText';
/** Playful handles make a real name unnecessary; the person still chooses freely. */
const names: Record<ModeLanguage, string[]> = {
  sv: ['Glada Gåsen','Morgonstjärnan','Kvällsvind','Lilla Lind','Skogsströvare','Solstråle','Lugn Fors','Nära Vän','Snabba Skon','Parkpinglan','Daggdroppe','Vandraren'],
  da: ['Glade Gås','Morgenstjerne','Aftenbrise','Lille Lind','Skovvandrer','Solstråle','Rolig Fos','Nær Ven','Hurtige Sko','Parkpil','Dugdråbe','Vandringsmand'],
  en: ['Happy Goose','Morning Star','Evening Breeze','Little Linden','Forest Wanderer','Sunbeam','Calm Current','Close Friend','Swift Shoes','Park Songbird','Dewdrop','The Walker'],
};
export const suggestNickname = (lang: ModeLanguage) => {
  const list = names[lang] || names.sv;
  const base = list[Math.floor(Math.random() * list.length)];
  return `${base} ${Math.floor(10 + Math.random() * 90)}`;
};
