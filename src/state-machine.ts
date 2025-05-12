/* eslint-disable @typescript-eslint/no-floating-promises */

type StateTransition<S extends string = string, E extends string = string, C extends ((...args: unknown[]) => (Promise<unknown> | unknown | void)) = (...args: unknown[]) => void> =
  // state transition without callback
  | readonly [S, E, S]
  // state transition with callback
  | readonly [S, E, S, C];

export type TransitionObject<
  STATE extends string = string,
  EVENT extends string = string,
  CALLBACK extends ((...args: unknown[]) => (Promise<unknown> | unknown | void)) = (...args: unknown[]) => void,
> = {
  fromState: STATE;
  event: EVENT;
  toState: STATE;
  cb?: CALLBACK;
};

type ExtractInitialStates<T> = T extends readonly StateTransition[]
  ? T[number] extends [infer S extends string, unknown, unknown, ...unknown[]]
  ? S
  : never
  : never;

type ExtractStates<T> = T extends readonly (infer R)[]
  ? R extends [infer S extends string, unknown, infer U extends string, ...unknown[]]
  ? S | U
  : never
  : never;

type AllToStates<T> = T extends readonly unknown[]
  ? { [K in keyof T]: T[K] extends [unknown, unknown, infer U extends string, ...unknown[]] ? U : never }[keyof T & number]
  : never;

type AllFromStates<T> = T extends readonly unknown[]
  ? { [K in keyof T]: T[K] extends [infer S extends string, unknown, unknown, ...unknown[]] ? S : never }[keyof T & number]
  : never;

/** Extract states that don't have outgoing transitions (final states) */
type ExtractFinalStates<T> = Exclude<AllToStates<T>, AllFromStates<T>>;

/** Extract states that have outgoing transitions (non-final states) */
type ExtractIntermediateStates<T> = AllFromStates<T>;

type ExtractEvents<T> = T extends readonly (infer R)[]
  ? R extends [unknown, infer E extends string, unknown, ...unknown[]]
  ? E
  : never
  : never;

type ExtractEventsForState<T, S> =
  T extends readonly (infer R)[]
  ? R extends readonly [infer FromState, infer E, infer ToState, ...unknown[]]
  ? FromState extends S
  ? E
  : never
  : never
  : never;

type ValidEventsInTransitions<T> = T extends readonly (infer R)[]
  ? R extends readonly [unknown, infer E, unknown, ...unknown[]]
    ? E
    : never
  : never;

type ValidFromStatesForEvent<T, E> = T extends readonly (infer R)[]
  ? R extends readonly [infer FromState, infer EventType, unknown, ...unknown[]]
    ? EventType extends E
      ? FromState
      : never
    : never
  : never;

type ExtractStatesForEvent<
  T, 
  E extends ValidEventsInTransitions<T>, 
  S extends ValidFromStatesForEvent<T, E> | never = never
> =
  T extends readonly (infer R)[]
  ? R extends readonly [infer FromState, infer EventType, infer ToState, ...unknown[]]
    ? EventType extends E
      ? S extends never
        ? ToState
        : FromState extends S
          ? ToState
          : never
      : never
    : never
  : never;

export type EventResult<TState> = {
  state: TState;
  /** Error from invalid event/state or from callback */
  error?: string | undefined;
  /** Result from callback */
  data?: unknown | null;
};

class StateMachine<
  TStateTransitions extends readonly StateTransition[] = readonly StateTransition[],
  TState extends string = ExtractStates<TStateTransitions> & string,
  TEvent extends string = ExtractEvents<TStateTransitions> & string,
  TInitialStates extends TState = ExtractInitialStates<TStateTransitions> & TState,
  TIntermediateStates extends TState = ExtractIntermediateStates<TStateTransitions> & TState,
  TFinalStates extends string = ExtractFinalStates<TStateTransitions> & string,
> {
  params: {
    stateTransitions: TStateTransitions;
    currentState: TState;
  };
  protected _transitionObjects: TransitionObject<TState, TEvent, (...args: unknown[]) => unknown>[] = [];

  // memoized states
  protected _states?: TState[];
  protected _initialStates?: TInitialStates[];
  protected _intermediateStates?: TIntermediateStates[];
  protected _finalStates?: TFinalStates[];
  protected _events?: TEvent[];

  state: TState;
  previousState?: TIntermediateStates;

  constructor(
    readonly stateTransitions: TStateTransitions,
    readonly currentState?: TState,
  ) {
    const state = (currentState ?? stateTransitions[0][0]) as unknown as TState;

    // Parse transitions first to get all valid states
    this._transitionObjects = this.parseTransitions(stateTransitions);

    // Check if the provided state is valid
    const allStates = this.states;
    if (state && !allStates.includes(state)) {
      throw new Error(`Invalid state: ${state}. Valid states are: ${allStates.join(', ')}`);
    }

    // Check if state transitions are valid. TODO: define invalid transition.

    this.params = { stateTransitions, currentState: state };
    this.state = state;
  }

  get states(): TState[] {
    if (this._states) return this._states;

    const allStates = new Set<TState>();
    this._transitionObjects.forEach(({ fromState, toState }) => {
      allStates.add(fromState);
      allStates.add(toState);
    });

    this._states = Array.from(allStates) as TState[];
    return this._states;
  }

  get initialStates(): TInitialStates[] {
    if (this._initialStates) return this._initialStates;

    const maybeInitialStates = new Set<TState>();
    this._transitionObjects.forEach(({ fromState }) => {
      maybeInitialStates.add(fromState);
    });

    // Remove states that have incoming transitions
    this._transitionObjects.forEach(({ toState }) => maybeInitialStates.delete(toState));

    this._initialStates = Array.from(maybeInitialStates) as TInitialStates[];
    return this._initialStates;
  }

  get intermediateStates(): TIntermediateStates[] {
    if (this._intermediateStates) return this._intermediateStates;

    this._intermediateStates = this.states.filter(state =>
      !this.isInitial(state) && !this.isFinal(state),
    ) as TIntermediateStates[];

    return this._intermediateStates;
  }

  get finalStates(): TFinalStates[] {
    if (this._finalStates) return this._finalStates;

    const maybeFinalStates = new Set<TState>();
    this._transitionObjects.forEach(({ toState }) => {
      maybeFinalStates.add(toState);
    });

    // Remove states that have outgoing transitions
    this._transitionObjects.forEach(({ fromState }) => maybeFinalStates.delete(fromState));

    this._finalStates = Array.from(maybeFinalStates) as unknown as TFinalStates[];
    return this._finalStates;
  }

  get previousStates(): (TInitialStates | TIntermediateStates)[] {
    return this._transitionObjects
      .filter(trans => trans.toState === this.state)
      .map(trans => trans.fromState as TInitialStates | TIntermediateStates);
  }

  get nextStates(): (TIntermediateStates | TFinalStates)[] {
    return this._transitionObjects
      .filter(trans => trans.fromState === this.state)
      .map(trans => trans.toState as TIntermediateStates | TFinalStates);
  }

  /** Get all events from the state transitions */
  get events(): TEvent[] {
    if (this._events) return this._events;

    const events = new Set<TEvent>();
    this._transitionObjects.forEach(({ event }) => events.add(event));

    this._events = Array.from(events) as TEvent[];
    return this._events;
  }

  /** Get all valid events for the current or provided state */
  getValidEvents(state?: TState): TEvent[] {
    return this._transitionObjects.filter(trans =>
      trans.fromState === (state ?? this.state),
    ).map(({ event }) => event);
  }

  is<S extends TState>(state: S): this is StateMachine<TStateTransitions, S> {
    return this.state === state;
  }

  isInitial(state?: TState): boolean {
    return (this.initialStates as TState[]).includes(state ?? this.state);
  }

  isIntermediate(state?: TState): boolean {
    return (this.intermediateStates as TState[]).includes(state ?? this.state);
  }

  isFinal(state?: TState): boolean {
    return (this.finalStates as unknown as TState[]).includes(state ?? this.state);
  }

  /**
   * Check if the state machine can process the given event in its current state.
   * When used after `is()`, autocomplete will only show valid events for that state.
   */
  can<S extends TState, E extends ExtractEventsForState<TStateTransitions, S>>(
    this: StateMachine<TStateTransitions, S>,
    event: E
    // TODO: extract states for event based on can argument, then
    // use type predicate to update `state` after `can`
    // e.g this is this & { state: ExtractStatesForEvent<TStateTransitions, E, S> }
  ): boolean {
    return this._transitionObjects.some(trans =>
      trans.fromState === this.state &&
      trans.event === event,
    );
  }

  /**
   * Send an event to the state machine.
   * When used after `is()`, autocomplete will only show valid events for that state.
   */
  async event<S extends TState, E extends ExtractEventsForState<TStateTransitions, S>>(
    this: StateMachine<TStateTransitions, S>,
    event: E,
    payload?: unknown
  ): Promise<EventResult<TState>> {
    try {
      const result = await this.dispatch(event, payload);
      if (result) return { state: this.state, data: result };
      return { state: this.state };
    } catch (error) {
      return { state: this.state, error: String(error) };
    }
  }

  async eventOrFail<S extends TState, E extends ExtractEventsForState<TStateTransitions, S>>(
    this: StateMachine<TStateTransitions, S>,
    event: E,
    payload?: unknown
    // TODO: add asserts is so state is in sync
  ): Promise<EventResult<TState>> {
    try {
      const result = await this.dispatch(event, payload);
      if (result) return { state: this.state, data: result };
      return { state: this.state };
    } catch (error) {
      throw error
    }
  }

  /**
   * Dispatch an event to the state machine
   * @param event Event to dispatch
   * @param payload Additional arguments to pass to the transition callback
   * @returns Promise that resolves when the transition is complete
   */
  protected async dispatch(event: TEvent, payload?: unknown): Promise<unknown> {
    return new Promise<void>((resolve, reject) => {
      // delay execution to make it async
      setTimeout(() => {
        // find transition
        const found = this._transitionObjects.some((tran) => {
          if (tran.fromState === this.state && tran.event === event) {
            // Store previous state for reference
            this.previousState = this.state as TIntermediateStates;

            if (tran.cb && typeof tran.cb === "function") {
              try {
                const transition = {
                  fromState: this.state,
                  event,
                  toState: tran.toState,
                }
                const p = tran.cb({ transition, payload });
                if (p instanceof Promise) {
                  p.then(() => {
                    // Only update state after successful callback execution
                    if (tran.toState) this.state = tran.toState;
                    resolve(p);
                  })
                  return true;
                } else {
                  // Callback executed successfully, update state
                  if (tran.toState) this.state = tran.toState;
                  resolve(p as any);
                  return true;
                }
              } catch (e) {
                // Callback threw an error, don't update state
                reject(`Error when dipatching event: ${e}`);
                return true;
              }
            } else {
              // No callback, update state directly
              if (tran.toState) this.state = tran.toState;
              resolve();
              return true;
            }
          }
          return false;
        });

        // no such transition
        if (!found) {
          const errorMessage = this.formatError(this.state, event);
          reject(new Error(errorMessage));
        }
      }, 0);
    });
  }

  protected formatError(fromState: TState, event: TEvent) {
    return `invalid event '${String(event)}' for state '${String(fromState)}'`;
  }

  /**
   * Generate a Mermaid StateDiagram of the current machine.
   */
  toMermaidDiagram(title?: string) {
    const diagram: string[] = [];
    if (title) {
      diagram.push("---");
      diagram.push(`title: ${title}`);
      diagram.push("---");
    }
    diagram.push("stateDiagram-v2");
    diagram.push(`  [*] --> ${String(this.params.currentState)}`);

    this._transitionObjects.forEach(({ event, fromState, toState }) => {
      if (fromState && toState && event) {
        const from = String(fromState);
        const to = String(toState);
        const evt = String(event);
        diagram.push(`  ${from} --> ${to}: ${evt}`);
      }
    });

    // find terminal states
    const ts = new Set<TState>();
    this._transitionObjects.forEach(({ toState }) => {
      if (toState) ts.add(toState);
    });
    this._transitionObjects.forEach(({ fromState }) => ts.delete(fromState));
    ts.forEach((state) => diagram.push(`  ${String(state)} --> [*]`));

    return diagram.join("\n");
  }

  /** Convert state transitions to transition objects  */
  protected parseTransitions(stateTransitions: TStateTransitions) {
    let transitionObjects: TransitionObject<TState, TEvent, ((...args: unknown[]) => unknown)>[] = [];
    for (const state of stateTransitions) {
      const [fromState, event, toState, cb] = state;
      transitionObjects.push({
        fromState: fromState as unknown as TState,
        event: event as unknown as TEvent,
        toState: toState as unknown as TState,
        cb: cb as unknown as ((...args: unknown[]) => unknown),
      });
    }
    return transitionObjects;
  }
}

/**
 * Create a type-safe state machine from transition definitions.
 * 
 * Note: For the best type safety and autocompletion, use 'as const' with your transitions array.
 * Example: 
 *   createStateMachine([
 *     ["opened", "close", "closed"],
 *     ["closed", "open", "opened"],
 *   ])
 */
export function createStateMachine<
  S extends string,
  E extends string,
  T extends readonly StateTransition<S, E>[],
>(stateTransitions: T, currentState?: T[number][0] | T[number][2]): StateMachine<
  T,
  T[number][0] | T[number][2],
  T[number][1],
  T[number][0]
> {
  return new StateMachine(stateTransitions, currentState);
}

const sm = createStateMachine([
  ["opened", "close", "closed"],
  ["closed", "open", "opened"],
  ["closed", "break", "broken"],
]);

if (sm.can("close")) {
  const a = sm.state // should be "opened"
  //    ^?
  if (sm.is("opened")) {
    // 
  }
} 


// Test with from state: should give "closed" as the target state for "close" event from "opened" state
type TestWithFromState = ExtractStatesForEvent<typeof sm.params.stateTransitions, "close", "opened">
//   ^? should be "closed"

// Test without from state: should give all target states for "close" event (which is just "closed" in this case)
type TestWithoutFromState = ExtractStatesForEvent<typeof sm.params.stateTransitions, "close">
//   ^? should be "closed"

// Another test with "open" event
type TestOpenWithFromState = ExtractStatesForEvent<typeof sm.params.stateTransitions, "open", "closed">
//   ^? should be "opened"

// Another test without from state
type TestOpenWithoutFromState = ExtractStatesForEvent<typeof sm.params.stateTransitions, "break">
//   ^? should be "opened"

// Type safety tests - these would error at compile time
// @ts-expect-error - "invalid_event" is not a valid event in the state machine
type TestInvalidEvent = ExtractStatesForEvent<typeof sm.params.stateTransitions, "break", "opened">

// @ts-expect-error - "unknown_state" is not a valid from state for "close" event
type TestInvalidFromState = ExtractStatesForEvent<typeof sm.params.stateTransitions, "close", "unknown_state">

// @ts-expect-error - "closed" is not a valid from state for "close" event
type TestInvalidEventStateCombo = ExtractStatesForEvent<typeof sm.params.stateTransitions, "close", "closed">

