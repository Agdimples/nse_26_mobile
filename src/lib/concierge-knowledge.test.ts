import { describe, expect, it } from "vitest";
import { answerLocally, relevantKnowledge } from "./concierge-knowledge";

describe("offline concierge", () => {
  it("lists a day's programme", () => {
    const answer = answerLocally("What's on Tuesday?");
    expect(answer).toContain("Tuesday, December 1, 2026");
    expect(answer).toContain("Opening Ceremony");
  });

  it("finds events by time of day, with and without a day", () => {
    expect(answerLocally("what is on at 2pm on wednesday")).toContain("Poster Session 3");
    const anyDay = answerLocally("What's happening at 2pm?");
    expect(anyDay).toContain("Monday, November 30, 2026");
    expect(anyDay).toContain("Wednesday, December 2, 2026");
  });

  it("uses the previous question for follow-ups", () => {
    const history = ["What's on Tuesday?"];
    expect(answerLocally("And at 3pm?", history)).toContain("Tuesday, December 1, 2026");
    expect(answerLocally("What about Wednesday?", history)).toContain(
      "Wednesday, December 2, 2026",
    );
  });

  it("answers the keynote question with the slot", () => {
    const answer = answerLocally("Who is giving the opening keynote?");
    expect(answer).toContain("Gwabin Musa");
    expect(answer).toContain("Opening Ceremony");
  });

  it("looks events up by name", () => {
    expect(answerLocally("when is the AGM")).toContain("Thursday, December 3, 2026");
    expect(answerLocally("When is the gala night?")).toContain("Annual Dinner / Gala Night");
    expect(answerLocally("When is the spouses programme?")).toContain("Spouses Programme");
  });

  it("tolerates typos and contractions", () => {
    expect(answerLocally("whats the wifi pasword")).toContain("engineers2026");
  });

  it("ranks hotels by distance and price", () => {
    expect(answerLocally("Which hotel is closest to the venue?")).toContain("closest to the venue");
    expect(answerLocally("cheapest hotel")).toContain("most affordable");
    expect(answerLocally("Golden Sand hotel price")).toContain("Golden Sand");
  });

  it("locates rooms on the ICC floor plan", () => {
    expect(answerLocally("Where is the media room?")).toContain("Ground Floor");
  });

  it("searches nearby places by what they serve, not just category", () => {
    const suya = answerLocally("where do i get suya");
    expect(suya).toContain("matching **suya**");
    expect(suya).toContain("Jaja Suya Spot");
    expect(suya).not.toContain("Cravings");
    expect(suya).not.toContain("Grilled Fish");
    expect(answerLocally("any place for pizza and shawarma")).not.toContain("Cravings");
    expect(answerLocally("where can I get breakfast")).toContain("Bexil Garden");
    expect(answerLocally("where to buy groceries")).toContain("Sahad Store");
  });

  it("lists nearby places by category", () => {
    expect(answerLocally("Where can I eat near the venue?")).toContain("Restaurant options");
    expect(answerLocally("Is there a hospital nearby?")).toContain("Hospital options");
  });

  it("says so when a topic is not in the data", () => {
    expect(answerLocally("Where is the rooftop reception?")).toContain("rooftop");
    expect(answerLocally("tell me a joke about cats")).toContain("secretariat");
  });

  it("feeds relevant entries to the AI model", () => {
    expect(relevantKnowledge("wifi password")).toContain("engineers2026");
  });
});
