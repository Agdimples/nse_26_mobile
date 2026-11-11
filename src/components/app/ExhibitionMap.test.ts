import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/ui/tabs", () => {
  const Container = ({ children }: { children: ReactNode }) => createElement("div", null, children);
  return { Tabs: Container, TabsContent: Container, TabsList: Container, TabsTrigger: Container };
});

import ExhibitionMap from "./ExhibitionMap";

describe("exhibition booth links", () => {
  it("links available booths in every pavilion to the external form, but not allocated booths", () => {
    const html = renderToStaticMarkup(createElement(ExhibitionMap));
    const links = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);
    const allocated = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(
      (match) => match[0],
    );

    expect(links).toHaveLength(98);
    for (const link of links) {
      expect(link).toContain('href="https://forms.gle/CpNLskMr3XPa9VZW9"');
      expect(link).toContain("available");
    }
    for (const booth of ["Ac1", "B4", "C1", "D1"]) {
      expect(links.some((link) => link.includes(`aria-label="${booth}, available`))).toBe(true);
    }
    expect(allocated).toHaveLength(12);
    expect(allocated.some((button) => button.includes("Aa1, taken, allocated to"))).toBe(true);
    expect(allocated.every((button) => !button.includes("forms.gle"))).toBe(true);
    expect(html).not.toContain("<form");
  });
});
