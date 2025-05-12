# TypeScript State Machine (ts-state-machine)

```ts
const machine1 = createStateMachine([
  ["opened", "close", "closed"],
  ["closed", "open", "opened"],
  ["closed", "break", "broken"],
]);
```
