/* eslint-disable @typescript-eslint/no-floating-promises */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createStateMachine } from "../state-machine";

// Note: TypeScript should infer these types from the states array
// No need for explicit type annotations!
describe("DoorMachine", () => {
  test("should work with States array format", async () => {
    const door = createStateMachine([
      ["opened", "close", "closed", () => console.log("door is closed")],
      ["opened", "break", "broken", () => console.log("door is broken")],
      ["closed", "open", "opened", () => console.log("door is opened")],
      ["closed", "break", "broken", () => console.log("door is broken")],
      ["locked", "unlock", "unlocked", () => console.log("door is unlocked")],
      ["unlocked", "lock", "locked", () => console.log("door is locked")],
    ]);

    // @ts-expect-error - "invalid" is not a valid state
    console.log(door.state === "invalid");
    // @ts-expect-error - "invalid-event" is not a valid event
    console.log(door.can("invalid-event"));
    // @ts-expect-error - "invalid-event" is not a valid event
    console.log(await door.event("invalid-event"));
    assert.equal(door.state, "opened");
    assert.deepEqual(door.nextStates, ["closed", "broken"]);
    assert.deepEqual(door.previousStates, ["closed"]);
    assert.equal(door.can("close"), true);

    const result1 = await door.event("close");
    assert.deepEqual(result1, { state: "closed" });
    assert.equal(door.state, "closed");

    assert.equal(door.can("close"), false);
    assert.deepEqual(door.nextStates, ["opened", "broken"]);
    assert.deepEqual(door.previousStates, ["opened"]);
    
    // @ts-expect-error - "sad" is not a valid event
    await door.event("sad");

    const result2 = await door.event("close");
    assert.deepEqual(result2, { state: "closed", error: "Error: invalid event 'close' for state 'closed'" });
    assert.equal(door.state, "closed");
    assert.deepEqual(door.getValidEvents(), ["open", "break"]);

    assert.deepEqual(door.finalStates, ["broken"]);
    assert.equal(door.isFinal(), false);

    const result3 = await door.event("break");
    assert.deepEqual(result3, { state: "broken" });
    assert.equal(door.state, "broken");
    // This comparison should error if our type checking is working
    console.log(door.state === "asdf");
    assert.equal(door.isFinal(), true);
    assert.deepEqual(door.nextStates, []);
    assert.equal(door.can("close"), false);

    const result4 = await door.event("close");
    assert.deepEqual(result4, { state: "broken", error: "Error: invalid event 'close' for state 'broken'" });
    assert.deepEqual(door.getValidEvents(), []);

    assert.deepEqual(door.states, ["opened", "closed", "broken", "locked", "unlocked"]);
    assert.deepEqual(door.events, ["close", "break", "open", "unlock", "lock"]);
  });

  test("should handle a state machine with one final state", async () => {
    // Define a simple workflow state machine with one final state
    const workflow = createStateMachine([
      ["draft", "submit", "submitted"],
      ["submitted", "approve", "approved"],
      ["submitted", "reject", "rejected"],
      // "approved" and "rejected" are the final states (no outgoing transitions)
    ]);

    // Initial state
    assert.equal(workflow.state, "draft");
    assert.deepEqual(workflow.finalStates, ["approved", "rejected"]);
    assert.equal(workflow.isFinal(), false);

    // Transition to submitted
    await workflow.event("submit");
    assert.equal(workflow.state, "submitted");
    assert.equal(workflow.isFinal(), false);

    // Transition to approved (final state)
    await workflow.event("approve");
    assert.equal(workflow.state, "approved");
    assert.equal(workflow.isFinal(), true);
    assert.deepEqual(workflow.nextStates, []);
    assert.deepEqual(workflow.getValidEvents(), []);
  });

  test("should handle a state machine with two final states", async () => {
    // Define a binary decision state machine with two final states
    const decision = createStateMachine([
      ["start", "next", "ok"],
      ["start", "next", "fail"],
      // Both "endA" and "endB" are final states
    ]);

    // Initial state
    assert.equal(decision.state, "start");
    assert.deepEqual(decision.finalStates.sort(), ["ok", "fail"].sort());
    assert.equal(decision.isFinal(), false);
    assert.deepEqual(decision.nextStates.sort(), ["ok", "fail"].sort());

    // Transition to endA (first final state)
    await decision.event("next");
    assert.equal(decision.state, "ok");
    assert.equal(decision.isFinal(), true);
    assert.deepEqual(decision.nextStates, []);
  });

  test("should handle a state machine with no final states", async () => {
    // Define a circular state machine with no final states
    const circular = createStateMachine([
      ["state1", "next", "state2"],
      ["state2", "next", "state3"],
      ["state3", "next", "state1"], // Circular, back to start
    ]);

    // Initial state
    assert.equal(circular.state, "state1");
    assert.deepEqual(circular.finalStates, []);
    assert.equal(circular.isFinal(), false);

    // Cycle through states
    await circular.event("next");
    assert.equal(circular.state, "state2");
    assert.equal(circular.isFinal(), false);

    await circular.event("next");
    assert.equal(circular.state, "state3");
    assert.equal(circular.isFinal(), false);

    await circular.event("next");
    assert.equal(circular.state, "state1");
    assert.equal(circular.isFinal(), false);

    // Verify there are no final states
    assert.deepEqual(circular.finalStates, []);
  });

  test("should track previous state correctly", async () => {
    // Define a simple state machine to test previousState tracking
    const tracker = createStateMachine([
      ["start", "step1", "middle"],
      ["middle", "step2", "end"],
    ]);

    // Initial state should have undefined previousState
    assert.equal(tracker.state, "start");
    assert.equal(tracker.previousState, undefined);
    assert.equal(tracker.isInitial(), true);

    // After first transition
    await tracker.event("step1");
    assert.equal(tracker.state, "middle");
    assert.equal(tracker.previousState, "start");
    assert.equal(tracker.isInitial(), false);

    // After second transition
    await tracker.event("step2");
    assert.equal(tracker.state, "end");
    assert.equal(tracker.previousState, "middle");
    assert.equal(tracker.isInitial(), false);
  });
});
