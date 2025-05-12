const fs = require('fs');
const path = require('path');

// Create the ESM entry point
const createEsmEntry = () => {
  // Create the ESM index file that points to the ESM build
  const esmIndexContent = `import * as esmModule from './esm/index.js';

export const createStateMachine = esmModule.createStateMachine;
export const StateMachine = esmModule.StateMachine;
export default esmModule;
`;

  fs.writeFileSync(path.join(__dirname, '../dist/index.esm.js'), esmIndexContent);
  console.log('✅ Created ESM entry point at dist/index.esm.js');
};

createEsmEntry(); 
