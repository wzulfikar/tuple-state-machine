# Tuple State Machine Demo

This is a demonstration app for the [tuple-state-machine](https://github.com/wzulfikar/tuple-state-machine) library.

## Examples

This demo includes two examples:

1. **Traffic Light Example**: A simple state machine demonstrating the traffic light states (red, green, yellow).
2. **Document Workflow**: A more complex state machine showing a document approval workflow with multiple state transitions and actions.

## Tree Shaking

The demo also shows how the `tuple-state-machine` library is fully tree-shakeable, meaning that only the functions and components you actually use will be included in the final bundle.

The library has properly configured:
- `"sideEffects": false` in package.json
- ESM modules support with proper exports configuration
- Named exports that can be individually imported

## Running the Demo

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit `http://localhost:5173` in your browser to see the demo in action.

## Building the Demo

```bash
npm run build
```

The built assets will be in the `dist` directory.
