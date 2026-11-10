import { describe, it, expect } from "vitest";
import * as React from "react";
import { Apple, Linux, Terminal, Windows, Github } from "./components/icons/brand-icons";
import { BrandBadge, BrandLogo } from "./components/brand/brand-badge";
import { SiteHeader } from "./components/layout/site-header";
import { SiteFooter } from "./components/layout/site-footer";
import { SiteShell } from "./components/layout/site-shell";
import { InstallTabs } from "./components/install/install-tabs";
import { HeroTerminal } from "./components/home/hero-terminal";
import { ContactForm } from "./components/contact/contact-form";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Select, Switch } from "./components/ui/select";
import { Button } from "./components/ui/button";
import { ThemeProvider } from "./components/theme/theme-provider";
import { ThemeScript } from "./components/theme/theme-script";
import {
  ThemeToggle,
  ThemeSwitch,
  ThemeToggleButton,
  ThemeSegmented,
} from "./components/theme/theme-toggle";

describe("Component render test", () => {
  it("renders all brand icons and badges", () => {
    expect(React.createElement(Apple)).toBeDefined();
    expect(React.createElement(Linux)).toBeDefined();
    expect(React.createElement(Terminal)).toBeDefined();
    expect(React.createElement(Windows)).toBeDefined();
    expect(React.createElement(Github)).toBeDefined();
    expect(React.createElement(BrandBadge)).toBeDefined();
    expect(React.createElement(BrandLogo)).toBeDefined();
  });

  it("renders components using brand icons and UI primitives", () => {
    expect(React.createElement(SiteHeader)).toBeDefined();
    expect(React.createElement(SiteFooter)).toBeDefined();
    expect(React.createElement(InstallTabs)).toBeDefined();
    expect(React.createElement(HeroTerminal)).toBeDefined();
    expect(React.createElement(ContactForm)).toBeDefined();
    expect(React.createElement(Card)).toBeDefined();
    expect(React.createElement(CardHeader)).toBeDefined();
    expect(React.createElement(CardTitle)).toBeDefined();
    expect(React.createElement(CardContent)).toBeDefined();
    expect(React.createElement(Input)).toBeDefined();
    expect(React.createElement(Select)).toBeDefined();
    expect(React.createElement(Switch)).toBeDefined();
    expect(React.createElement(Button)).toBeDefined();
  });

  it("renders theme provider, theme script, and theme toggles", () => {
    expect(React.createElement(ThemeScript)).toBeDefined();
    expect(
      React.createElement(
        ThemeProvider,
        null,
        React.createElement(ThemeToggle),
        React.createElement(ThemeSwitch),
        React.createElement(ThemeToggleButton),
        React.createElement(ThemeSegmented),
        React.createElement(SiteShell, null, React.createElement("div", null, "Content")),
      ),
    ).toBeDefined();
  });
});
