export interface ConferenceScheduleEvent {
  time: string;
  title: string;
  location: string;
  category?: ConferenceScheduleCategory;
}

export type ConferenceScheduleCategory = "young-engineers" | "spouses" | "technical" | "social";

export interface ConferenceScheduleDay {
  date: string;
  events: ConferenceScheduleEvent[];
}

export const conferenceSchedule: ConferenceScheduleDay[] = [
  {
    date: "Monday, November 30, 2026",
    events: [
      {
        time: "8:00am - 6:00pm",
        title: "Registration/Arrival",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "9:30am - 10:30am",
        title: "Press Conference",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "10:00am - 1:00pm",
        title: "Fellowship Symposium",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "1:00pm",
        title: "Courtesy Visit to Host Governor",
        location: "Borno State Government House",
        category: "social",
      },
      {
        time: "2:00pm - 4:00pm",
        title: "Fellowship Conferment Ceremony",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "6:00pm - 8:00pm",
        title: "Presidential Cocktail Party",
        location: "",
        category: "social",
      },
    ],
  },
  {
    date: "Tuesday, December 1, 2026",
    events: [
      {
        time: "8:00am - 6:00pm",
        title: "Registration",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "10:00am - 12:30pm",
        title: "Opening Ceremony",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "12:30pm - 1:00pm",
        title: "Lunch Break",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "1:00pm - 5:00pm",
        title: "Spouses Programme",
        location: "Muhammadu Indimi International Conference Centre",
        category: "spouses",
      },
      {
        time: "1:00pm - 5:00pm",
        title: "Young Engineers Programme",
        location: "Academic Staff Union of Universities (ASUU) hall",
        category: "young-engineers",
      },
      {
        time: "1:00pm - 2:10pm",
        title: "Panel Discussion Session 1",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "2:10pm - 2:40pm",
        title: "Poster Session 1 (All participants to visit the stand)",
        location: "",
        category: "technical",
      },
      {
        time: "2:20pm - 3:30pm",
        title: "Panel Discussion Session 2",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "3:00pm - 3:30pm",
        title: "Poster Session 2 (All participants to visit the stand)",
        location: "",
        category: "technical",
      },
      {
        time: "3:30pm - 4:40pm",
        title: "Panel Discussion Session 3",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "5:00pm - 8:00pm",
        title: "Election Manifesto",
        location: "International Conference Centre (ICC) Main hall",
      },
    ],
  },
  {
    date: "Wednesday, December 2, 2026",
    events: [
      {
        time: "9:00am - 6:00pm",
        title: "Registration",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "9:00am - 6:00pm",
        title: "Spouses Programme",
        location: "Muhammadu Indimi International Conference Centre",
        category: "spouses",
      },
      {
        time: "9:00am - 6:00pm",
        title: "Young Engineers Programme",
        location: "Academic Staff Union of Universities (ASUU) hall",
        category: "young-engineers",
      },
      {
        time: "9:00am - 10:00am",
        title: "Leadership and Energy Talks",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "10:00am - 11:00am",
        title: "Technical Session 1",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "11:00am - 12:15pm",
        title: "Panel Discussion Session 4",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "12:15pm - 12:45pm",
        title: "Lunch Break",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "12:45pm - 2:00pm",
        title: "Panel Discussion Session 5",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "2:00pm - 2:30pm",
        title: "Poster Session 3 (All participants to visit the stand)",
        location: "",
        category: "technical",
      },
      {
        time: "2:30pm - 4:00pm",
        title: "Panel Discussion Session 6",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "4:00pm - 6:00pm",
        title: "Group Dynamics Competition (Branches and Divisions)",
        location: "International Conference Centre (ICC) Main hall",
        category: "social",
      },
      {
        time: "6:00pm - 8:00pm",
        title: "Welfare/Cultural Night",
        location: "",
        category: "social",
      },
    ],
  },
  {
    date: "Thursday, December 3, 2026",
    events: [
      {
        time: "9:00am - 10:00pm",
        title: "Presentation of Communique and Closing ceremony",
        location: "",
        category: "technical",
      },
      {
        time: "10:00am - 1:00pm",
        title: "Annual General Meeting (AGM)",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
      },
      {
        time: "1:00pm - 2:00pm",
        title: "Lunch Break",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "6:00pm - 9:00pm",
        title: "Annual Dinner / Gala Night",
        location: "",
        category: "social",
      },
    ],
  },
  {
    date: "Friday, December 4, 2026",
    events: [
      {
        time: "10:00am - 11:00am",
        title: "Closing Press Conference",
        location: "International Conference Centre (ICC) Main hall",
      },
      {
        time: "11:00am",
        title: "Departure",
        location: "International Conference Centre (ICC) Main hall",
      },
    ],
  },
];

export function getScheduledEvents() {
  return conferenceSchedule.flatMap((day) =>
    day.events.map((event) => ({
      ...event,
      date: day.date,
      eventKey: getScheduleEventKey(day.date, event.time, event.title),
    })),
  );
}

export function getScheduleEventKey(date: string, time: string, title: string) {
  return `${date}|${time}|${title}`;
}
