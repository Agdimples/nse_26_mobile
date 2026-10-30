export type ConferenceScheduleCategory = "young-engineers" | "spouses" | "technical" | "social";

export function getScheduleEventKey(date: string, time: string, title: string) {
  return `${date}|${time}|${title}`;
}
