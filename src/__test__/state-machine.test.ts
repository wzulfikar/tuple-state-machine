/* eslint-disable @typescript-eslint/no-floating-promises */

import { describe, it } from "node:test";
import * as assert from "node:assert";
import { createStateMachine } from "../state-machine";

describe("StateMachine", () => {
  it("should create a state machine", () => {
    const machine1 = createStateMachine([
      ["opened", "close", "closed"],
      ["closed", "open", "opened"],
      ["closed", "break", "broken"],
    ]);
    assert.equal(machine1.state, "opened");

    const stateTransitions = [
      ["opened", "close", "closed"],
      ["closed", "open", "opened"],
      ["closed", "break", "broken"],
    ] as const;

    const machine2 = createStateMachine(stateTransitions, "closed");
    assert.equal(machine2.state, "closed");

    // This will throw at runtime if uncommented
    try {
      const machine3 = createStateMachine([
        ["opened", "close", "closed"],
        ["closed", "open", "opened"],
        ["closed", "break", "broken"],
        // @ts-expect-error - This should throw an error for invalid state
      ], "invalid_state");
      assert.fail("Should have thrown an error for invalid state");
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes("Invalid state"));
    }
  });

  it("should properly guard state transitions", async () => {
    const machine = createStateMachine([
      ["opened", "close", "closed"],
      ["closed", "open", "opened"],
      ["closed", "break", "broken"],
    ]);

    // Initial state should be "opened"
    assert.equal(machine.state, "opened");

    // Type narrowing with is() - this demonstrates autocomplete works
    if (machine.is("opened")) {
      machine.state;
      //      ^?

      machine.can("close")

      // @ts-expect-error - "break" is not valid event for "opened"
      machine.can("break");

      // In the opened state, we can only call "close"
      assert.equal(machine.can("close"), true);

      // @ts-expect-error - "open" is not valid event for "opened"
      assert.equal(machine.can("open"), false);

      const result = await machine.event("close");
      assert.equal(result.error, undefined);
      assert.equal(result.state, "closed");
    }

    // Now in closed state
    assert.equal(machine.state, "closed");

    // In closed state, we can call "open" or "break"
    assert.equal(machine.can("open"), true);
    assert.equal(machine.can("break"), true);
    assert.equal(machine.can("close"), false);

    // Test the break event
    const result = await machine.event("break");
    assert.equal(result.error, undefined);
    assert.equal(result.state, "broken");

    // In broken state, no events are valid
    assert.equal(machine.can("open"), false);
    assert.equal(machine.can("close"), false);
    assert.equal(machine.can("break"), false);

    // Attempting an invalid event should return an error
    const invalidResult = await machine.event("open" as any);
    assert.notEqual(invalidResult.error, undefined);
  });

  it("demonstrates type safety with as const assertion", () => {
    // With as const - we get full type safety and auto-completion
    const safetyMachine = createStateMachine([
      ["opened", "close", "closed"],
      ["closed", "open", "opened"],
      ["closed", "break", "broken"],
    ]);

    // TypeScript knows exactly which states and events are valid

    // @ts-expect-error - This would fail because "invalid" is not a valid state
    safetyMachine.is("invalid");

    // @ts-expect-error - This would fail because "invalid" is not a valid event
    assert.equal(safetyMachine.can("invalid"), false);

    // @ts-expect-error - This would fail because "invalid" is not a valid event
    safetyMachine.event("invalid")

    // But these are valid and would work fine
    safetyMachine.is("opened");
    safetyMachine.can("close");
    safetyMachine.event("close");
  });

  it("works without as const but loses some type safety", () => {
    // Without as const - still works but with weaker type checking
    const machine = createStateMachine([
      ["opened", "close", "closed"],
      ["closed", "open", "opened"],
      ["closed", "break", "broken"],
    ]);

    // The machine works correctly at runtime
    assert.equal(machine.state, "opened");

    // But TypeScript can't check as strictly at compile time
    // These don't cause type errors but would fail at runtime:
    // machine.is("someInvalidState"); 
    // machine.can("someInvalidEvent");
    // machine.event("someInvalidEvent");
  });

  it("works with optional callback", async () => {
    const errorMessage = "Callback error test";
    const machine = createStateMachine([
      ["opened", "close", "closed", () => console.log("close")], // successful callback
      ["closed", "open", "opened"], // no callback
      ["closed", "break", "broken", () => { throw new Error(errorMessage) }], // failed callback
    ]);

    const result = await machine.event("close");
    assert.equal(result.error, undefined);
    assert.equal(machine.state, "closed");

    const result2 = await machine.event("open");
    assert.equal(result2.error, undefined);
    assert.equal(machine.state, "opened");

    await machine.event("close");
    const result3 = await machine.event("break");
    assert.equal(result3.error, `Error when dipatching event: Error: ${errorMessage}`);
    assert.equal(machine.state, "closed");

    // Callback with args
    const machine2 = createStateMachine([
      // TODO: add type for transitionPayload
      ["opened", "close", "closed", (transitionPayload) => {
        console.log("door is closed", transitionPayload)
        return transitionPayload
      }], // successful callback
      ["closed", "open", "opened", () => { console.log("opened") }], // callback with no return
      ["closed", "break", "broken", () => { throw new Error(errorMessage) }], // failed callback
    ]);

    const result4 = await machine2.event("close", { door: "front" });
    assert.equal(result4.error, undefined);
    assert.equal(machine2.state, "closed");
    assert.deepEqual(result4.data, {
      payload: { door: "front" },
      transition: {
        event: "close",
        fromState: "opened",
        toState: "closed",
      },
    });

    const result5 = await machine2.event("open");
    assert.equal(result5.error, undefined);
    assert.equal(machine2.state, "opened");
    assert.equal(result5.data, undefined);
  });

  it("returns previous and next states", async () => {
    const machine = createStateMachine([
      ["opened", "close", "closed"],
      ["closed", "open", "opened"],
      ["closed", "break", "broken"],
    ]);

    assert.equal(machine.state, "opened");
    assert.deepEqual(machine.previousStates, ["closed"]);
    assert.deepEqual(machine.nextStates, ["closed"]);

    await machine.event("close");
    assert.equal(machine.state, "closed");
    assert.deepEqual(machine.previousStates, ["opened"]);
    assert.deepEqual(machine.nextStates, ["opened", "broken"]);

    await machine.event("break");
    assert.deepEqual(machine.previousStates, ["closed"]);
    assert.deepEqual(machine.nextStates, []);
  });

  it("draws a diagram of the state machine", () => {
    const machine = createStateMachine([
      ["opened", "close", "closed"],
      ["closed", "open", "opened"],
      ["closed", "break", "broken"],
    ]);

    const diagram = machine.toMermaidDiagram();
    assert.equal(diagram, `stateDiagram-v2
  [*] --> opened
  opened --> closed: close
  closed --> opened: open
  closed --> broken: break
  broken --> [*]`);
  });
});
