import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Submit</Button>);

    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });
});
