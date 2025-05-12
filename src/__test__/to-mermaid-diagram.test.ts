/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createStateMachine } from "../state-machine";

describe("StateMachine#toMermaid()", () => {
  test("generate state diagram", async () => {
    // Create a door state machine using createStateMachine
    const door = createStateMachine([
      ["closed", "open", "opened"],
      ["opened", "close", "closed"],
      ["opened", "break", "broken"],
      ["closed", "break", "broken"],
      ["closed", "lock", "locked"],
      ["locked", "unlock", "unlocked"],
      ["unlocked", "lock", "locked"],
      ["locked", "break", "broken"],
    ]);
    const mmd = door.toMermaidDiagram();
    const lines = mmd.split("\n");

    assert.equal(lines[0], "stateDiagram-v2");
    assert.equal(lines[1], "  [*] --> closed");
    assert.equal(lines[2], "  closed --> opened: open");
    assert.equal(lines[3], "  opened --> closed: close");
    assert.equal(lines[4], "  opened --> broken: break");
    assert.equal(lines[5], "  closed --> broken: break");
    assert.equal(lines[6], "  closed --> locked: lock");
    assert.equal(lines[7], "  locked --> unlocked: unlock");
    assert.equal(lines[8], "  unlocked --> locked: lock");
    assert.equal(lines[9], "  locked --> broken: break");
    assert.equal(lines[10], "  broken --> [*]");
  });

  test("generate state diagram with title", async () => {
    // Create a door state machine using createStateMachine
    const door = createStateMachine([
      ["closed", "open", "opened"],
      ["opened", "close", "closed"],
    ]);
    const mmd = door.toMermaidDiagram("The Door Machine");
    const lines = mmd.split("\n");

    assert.equal(lines[0], "---");
    assert.equal(lines[1], "title: The Door Machine");
    assert.equal(lines[2], "---");
  });
});
