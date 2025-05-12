# TypeScript State Machine (tiny-state-machine)

[![Build Status](https://app.travis-ci.com/wzulfikar/tiny-state-machine.svg?branch=master)](https://app.travis-ci.com/github/wzulfikar/tiny-state-machine)
[![npm package](https://img.shields.io/npm/v/tiny-state-machine.svg?logo=nodedotjs&color=00a400)](https://www.npmjs.com/package/tiny-state-machine)
<img src="https://img.shields.io/badge/winter-is%20coming-5593c8" alt="It's already here!" height="20"/>

Finite state machines are useful for modeling complicated flows and keeping track of state. TS-FSM is a strongly typed finite state machine for TypeScript that is using promises for async operations.

## Features

- TypeScript native (compiles to ES6)
- Only 1 KB (minified) and zero dependencies!!!
- Hooks after state change - - async or sync callbacks
- Promises are used for async transition completion
- Generics for states and events types
- Simple tabular state machine definition
- Use with NodeJS or JS client

## Get it

  ```script
  git clone https://github.com/wzulfikar/tiny-state-machine.git
  cd tiny-state-machine
  npm install
  npm test
  ```

## Use it

  ```script
  npm install tiny-state-machine
 ```

## Basic Example

I'm modeling a "door" here. One can open the door, close it or break it. Each action is done async: when you open it goes into opening state and then resolved to opened state etc. Once broken, it reaches a final state.

<img src="https://mermaid.ink/svg/c3RhdGVEaWFncmFtLXYyCiAgICBbKl0gLS0+IENsb3NlZAogICAgQ2xvc2VkIC0tPiBPcGVuaW5nIDogT3BlbgogICAgT3BlbmluZyAtLT4gT3BlbmVkIDogb3BlbkNvbXBsZXRlCiAgICBPcGVuZWQgLS0+IENsb3NpbmcgOiBDbG9zZQogICAgQ2xvc2luZyAtLT4gQ2xvc2VkIDogY2xvc2VDb21wbGV0ZQogICAgQ2xvc2VkIC0tPiBCcm9rZW4gOiBCcmVhawogICAgT3BlbmluZyAtLT4gQnJva2VuIDogQnJlYWsKICAgIE9wZW5lZCAtLT4gQnJva2VuIDogQnJlYWsKICAgIENsb3NpbmcgLS0+IEJyb2tlbiA6IEJyZWFrCiAgICBCcm9rZW4gLS0+IFsqXQo=?bgColor=!white" alt="Door state machine" height="500" />

Let's code it in Typescript! Note that the same code can be run in Javascript, just remove the generics.

```typescript
import { t, StateMachine } from "tiny-state-machine";

// these are the states and events for the door
enum States { closing = 0, closed, opening, opened, broken };
enum Events { open = 100, openComplete, close, closeComplete, break };

// lets define the transitions that will govern the state-machine
const transitions = [
  /* fromState        event                 toState         callback */
  t(States.closed,    Events.open,        States.opening, onOpen),
  t(States.opening,   Events.openComplete,  States.opened,  justLog),
  t(States.opened,    Events.close,         States.closing, onClose),
  t(States.closing,   Events.closeComplete, States.closed,  justLog),
  t(States.closed,    Events.break,         States.broken,  justLog),
  t(States.opened,    Events.break,         States.broken,  justLog),
  t(States.opening,   Events.break,         States.broken,  justLog),
  t(States.closing,   Events.break,         States.broken,  justLog),
];

// initialize the state machine
const door = new StateMachine<States, Events>(
   States.closed,   // initial state
   transitions,     // array of transitions 
);

// transition callbacks - async functions
async function onOpen() {
    console.log("onOpen...");
    return door.dispatch(Events.openComplete);
}

async function onClose() {
    console.log("onClose...");
    return door.dispatch(Events.closeComplete);
}

// synchronous callbacks are also ok
function justLog() { 
    console.log(`${States[door.state]}`);
}

// we are ready for action - run a few state-machine steps...
new Promise(async (resolve) => {

    // open the door and wait for it to be opened
    await door.dispatch(Events.open);
    door.state; // => States.opened

    // check if the door can be closed
    door.can(Events.close); // => true

    // break the door async
    door.dispatch(Events.break).then(() => {
        // did we get to a finite state?
        door.isFinal(); // => true 
    });

    // door is now broken. It cannot be closed...
    try {
        await door.dispatch(Events.close);
        assert("should not get here!");
    } catch (e) {
        // we're good
    }

    // let the async complete
    setTimeout(resolve, 10);
});

```

## Another example

Check out [the test code](https://github.com/wzulfikar/tiny-state-machine/blob/master/src/__test__/state-machine.test.ts) - a class that implements a state machine with method binding, method params and more transitions. 100% coverage here!

## Beautiful :-)

Comments and suggestions are [welcome](https://github.com/wzulfikar/tiny-state-machine/issues/new).
# ts-state-machine
