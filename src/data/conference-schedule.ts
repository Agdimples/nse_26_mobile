export type ConferenceScheduleCategory = "young-engineers" | "spouses" | "technical" | "social";

export interface ConferenceScheduleEvent {
  time: string;
  title: string;
  // Empty string means no venue has been announced yet.
  location: string;
  category: ConferenceScheduleCategory | null;
  // Short theme or description shown when the card is expanded.
  summary?: string;
  // Labelled facts such as lead speaker, panelists or moderator.
  details?: { label: string; value: string }[];
  // Minute-by-minute run of show for ceremonies.
  timeline?: { time: string; text: string }[];
}

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
        category: null,
      },
      {
        time: "9:00am - 10:00am",
        title: "Press Conference",
        location: "International Conference Centre (ICC) Main hall",
        category: null,
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
        time: "11:00am - 4:00pm",
        title: "Spouses Programme",
        location: "Muhammadu Indimi International Conference Centre",
        category: "spouses",
        timeline: [
          { time: "8:00am", text: "Registration" },
          { time: "11:00am", text: "Picnic hosted by the host branch" },
          { time: "2:30pm", text: "Visit to the Shehu of Borno" },
        ],
      },
      {
        time: "2:00pm - 4:00pm",
        title: "Fellowship Conferment Ceremony",
        location: "International Conference Centre (ICC) Main hall",
        category: null,
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
        category: null,
      },
      {
        time: "10:00am - 12:40pm",
        title: "Opening Ceremony",
        location: "International Conference Centre (ICC) Main hall",
        category: null,
        summary:
          "Delegates and guests arrive from 8:00am. The President, Federal Republic of Nigeria, is Distinguished Guest of Honour.",
        details: [
          { label: "Keynote", value: "Gen. Christopher Gwabin Musa (Rtd), Minister of Defence" },
          { label: "Chief Host", value: "Gov. Babagana Umara Zulum of Borno State" },
          { label: "Welcome", value: "Engr. Mohammed Kabir Wanori, Planning Committee Chair" },
        ],
        timeline: [
          { time: "9:40am", text: "NSE President arrives" },
          { time: "9:45am", text: "Governor arrives" },
          { time: "9:50am", text: "Vice President arrives" },
          { time: "9:55am", text: "President and First Lady arrive" },
          { time: "10:00am", text: "National Anthem and prayer" },
          { time: "10:05am", text: "Recognition of dignitaries" },
          { time: "10:15am", text: "Welcome by Planning Committee Chair" },
          { time: "10:20am", text: "Address by NSE President" },
          { time: "10:30am", text: "Address by Governor of Borno State" },
          { time: "10:40am", text: "Fellowship Conferment" },
          { time: "11:00am", text: "Cultural troupe" },
          { time: "11:05am", text: "Keynote by the Minister of Defence" },
          { time: "11:15am", text: "Special Awards" },
          { time: "11:30am", text: "Book Launch" },
          { time: "11:50am", text: "Goodwill messages" },
          { time: "12:20pm", text: "Address by the President" },
          { time: "12:30pm", text: "Vote of thanks by Executive Secretary" },
          { time: "12:40pm", text: "Opening and tour of the Exhibition" },
        ],
      },
      {
        time: "12:50pm - 1:00pm",
        title: "Lunch Break",
        location: "International Conference Centre (ICC) Main hall",
        category: null,
      },
      {
        time: "1:00pm - 5:00pm",
        title: "Spouses Programme",
        location: "Muhammadu Indimi International Conference Centre",
        category: "spouses",
        timeline: [
          { time: "12:00pm", text: "Tea after the Opening Ceremony" },
          { time: "12:30pm", text: "Visit to the Governor's wife" },
          { time: "3:00pm", text: "Reception and lunch at Government House" },
        ],
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
        summary:
          "Engineering Innovation, Technology and National Security: Building a Resilient and Secure Nigeria",
        details: [
          {
            label: "Lead speaker",
            value: "Gen. Christopher Gwabin Musa (Rtd), Minister of Defence",
          },
          {
            label: "Panelists",
            value:
              "Inspector General, Nigeria Police Force; DG, Department of State Services; Chief of Army Staff; DG, National Intelligence Agency; Chief of Naval Staff; Chief of the Air Staff; Borno State Commissioner for Information and Internal Security",
          },
          { label: "Moderator", value: "Engr. Yetunde Aladeitan, PhD, FNSE" },
        ],
      },
      {
        time: "2:10pm - 2:40pm",
        title: "Poster Session 1 (All participants to visit the stand)",
        location: "",
        category: "technical",
        details: [{ label: "Chief Judge", value: "Engr. Prof. Temitope E. Odetoye, FNSE" }],
      },
      {
        time: "2:20pm - 3:30pm",
        title: "Panel Discussion Session 2",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
        summary: "Waste to Energy, Renewable Energy and Circular Economy Solutions",
        details: [
          { label: "Lead speaker", value: "Engr. Prof. E. C. Ejiogu (UNN)" },
          {
            label: "Panelists",
            value:
              "Engr. Prof. S. O. Enibe (UNN); Engr. Prof. C. A. Mgbemen (UNN); Oluwafemi Idowu-Adegoke (Ecoviridis Environmental Technology); Temitope Okunnu (FABE International Foundation); Adewole Taiwo (Eco-cyclo Plastic Ltd); Thara Aisha Atta (Trashformas Nigeria)",
          },
          { label: "Moderator", value: "Prof. (Mrs.) Christy Ijagbemi, FNSE (FUTA)" },
        ],
      },
      {
        time: "3:00pm - 3:30pm",
        title: "Poster Session 2 (All participants to visit the stand)",
        location: "",
        category: "technical",
      },
      {
        time: "3:30pm - 5:00pm",
        title: "Panel Discussion Session 3",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
        summary: "Smart Infrastructure, Surveillance and Cybersecurity Engineering",
      },
      {
        time: "5:00pm - 7:00pm",
        title: "Election Manifesto",
        location: "International Conference Centre (ICC) Main hall",
        category: null,
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
        category: null,
      },
      {
        time: "9:00am - 6:00pm",
        title: "Spouses Programme",
        location: "Muhammadu Indimi International Conference Centre",
        category: "spouses",
        timeline: [
          {
            time: "8:30am",
            text: "Welcome address by Mrs. Maimuna Ali Rabiu, National President, Spouses' Forum",
          },
          { time: "9:00am", text: "Tour of bottling and industrial sites" },
          { time: "12:00pm", text: "Coca-Cola plant" },
          { time: "2:00pm", text: "Flour Mill and Tomato Processing Plant" },
          { time: "4:00pm", text: "Lunch" },
          { time: "6:00pm", text: "Welfare/Cultural Night" },
        ],
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
        details: [
          {
            label: "Paper 1",
            value:
              "Education, Capacity Building and Local Content, by Engr. Prof. Gbenga Aribisala, FNSE, FAEng (VC, FUTECH Iyin Ekiti)",
          },
        ],
      },
      {
        time: "10:00am - 11:00am",
        title: "Technical Session 1",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
        details: [
          { label: "Paper 1", value: "Prof. Usman A. Tar" },
          { label: "Moderator", value: "Engr. Uchechi Edosomwan, FNSE (NAMA)" },
        ],
      },
      {
        time: "11:00am - 12:15pm",
        title: "Panel Discussion Session 4",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
        summary: "Water and Food Security for Sustainable Development",
        details: [
          {
            label: "Lead speaker",
            value: "Sen. Abubakar Kyari, Minister of Agriculture and Food Security",
          },
          {
            label: "Panelists",
            value:
              "Engr. Prof. Muhammad Attanda (Nigerian Horticultural Research Institute); Dr. Marcus Ogunbiyi (Perm. Sec., FMAFS); Prof. S. M. Musa (ATBU); Hon. Bello Ka'oje (House Committee on Agriculture and Food Sufficiency); Engr. Victor Ojiako (Director of Irrigation, FMWRS)",
          },
          { label: "Moderator", value: "Engr. Prof. Joshua Olaoye, FNSE" },
        ],
      },
      {
        time: "12:15pm - 12:45pm",
        title: "Lunch Break",
        location: "International Conference Centre (ICC) Main hall",
        category: null,
      },
      {
        time: "12:45pm - 2:00pm",
        title: "Panel Discussion Session 5",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
        summary: "Resilient Sustainable Transport and Green Infrastructure",
        details: [
          {
            label: "Lead speaker",
            value: "Otunba Oluwemimo Joseph Osanipin, DG, NADDC",
          },
          {
            label: "Panelists",
            value:
              "Arc. Emmanuel Falude; Olatunbosun Obayomi; Prof. Abiodun Musa Aibinu; Engr. Enonche Ugbabe",
          },
          { label: "Moderator", value: "Engr. Olusegun Olamoyegun, FNSE" },
        ],
      },
      {
        time: "2:00pm - 2:30pm",
        title: "Poster Session 3 (All participants to visit the stand)",
        location: "",
        category: "technical",
        details: [{ label: "Chief Judge", value: "Engr. Oluseun A. Faluyi, FNSE" }],
      },
      {
        time: "2:30pm - 4:00pm",
        title: "Panel Discussion Session 6",
        location: "International Conference Centre (ICC) Main hall",
        category: "technical",
        summary: "Affordable and Secure Housing for IDPs and Vulnerable Communities",
        details: [
          {
            label: "Lead speakers",
            value:
              "Minister of State for Housing and Urban Development; Hon. Oyetunde Ojo, MD/CEO, Federal Housing Authority",
          },
          { label: "Panelist", value: "Engr. Richard Yuanna Dauda (FCDA)" },
          { label: "Moderator", value: "Engr. (Mrs.) Abiola Oludaiye-Kosegbe, FNSE" },
        ],
      },
      {
        time: "4:00pm - 6:00pm",
        title: "Group Dynamics Competition (Branches and Divisions)",
        location: "International Conference Centre (ICC) Main hall",
        category: "social",
        details: [
          { label: "Divisions chair", value: "Engr. Prof. M. Dabo Ibrahim, FNSE" },
          { label: "Branches chair", value: "Engr. Olayinka Alli, FNSE" },
          { label: "Prizes", value: "1st: Trophy, plaque and cash. 2nd and 3rd: Plaque and cash." },
        ],
      },
      {
        time: "6:00pm - 9:00pm",
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
        time: "7:00am - 5:00pm",
        title: "Spouses Programme",
        location: "Muhammadu Indimi International Conference Centre",
        category: "spouses",
        timeline: [
          { time: "7:00am", text: "Aerobics and sports" },
          {
            time: "9:30am",
            text: "Talk on Healthy Marriage Lifestyle by Mr. Uchenna Paschal Ohaji, with Q&A",
          },
          { time: "10:10am", text: "Dream, dance, quiz and games competitions" },
          { time: "1:30pm", text: "Awards and lunch" },
          { time: "2:00pm", text: "Shopping" },
        ],
      },
      {
        time: "9:00am - 10:00am",
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
        category: null,
      },
      {
        time: "5:00pm - 9:00pm",
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
        category: null,
      },
      {
        time: "11:00am",
        title: "Departure",
        location: "International Conference Centre (ICC) Main hall",
        category: null,
      },
    ],
  },
];

export function getScheduleEventKey(date: string, time: string, title: string) {
  return `${date}|${time}|${title}`;
}
