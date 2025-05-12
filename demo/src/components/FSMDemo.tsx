import { useState } from 'react';
import { createStateMachine } from 'tuple-state-machine';

// Traffic light state machine
// States: red -> green -> yellow -> red
const trafficLightTransitions = [
  ['red', 'change', 'green'],
  ['green', 'change', 'yellow'],
  ['yellow', 'change', 'red'],
] as const;

const FSMDemo: React.FC = () => {
  const [stateMachine, setStateMachine] = useState(() => 
    createStateMachine(trafficLightTransitions, 'red')
  );
  
  const [history, setHistory] = useState<string[]>(['Started at: red']);

  // Style for the traffic lights
  const lightStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    margin: '10px',
    display: 'inline-block',
    opacity: 0.3,
    transition: 'all 0.3s ease'
  };
  
  const handleChange = async () => {
    if (stateMachine.can('change')) {
      const previousState = stateMachine.state;
      const result = await stateMachine.event('change');
      
      if (!result.error) {
        setStateMachine({ ...stateMachine }); // Force re-render with updated state
        setHistory(prev => [...prev, `${previousState} → ${result.state}`]);
      } else {
        setHistory(prev => [...prev, `Error: ${result.error}`]);
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Traffic Light State Machine</h2>
      
      <div style={{ margin: '30px 0' }}>
        <div 
          style={{ 
            ...lightStyle, 
            backgroundColor: 'red',
            opacity: stateMachine.state === 'red' ? 1 : 0.3,
            boxShadow: stateMachine.state === 'red' ? '0 0 20px red' : 'none'
          }} 
        />
        <div 
          style={{ 
            ...lightStyle, 
            backgroundColor: 'green',
            opacity: stateMachine.state === 'green' ? 1 : 0.3,
            boxShadow: stateMachine.state === 'green' ? '0 0 20px green' : 'none'
          }} 
        />
        <div 
          style={{ 
            ...lightStyle, 
            backgroundColor: 'yellow',
            opacity: stateMachine.state === 'yellow' ? 1 : 0.3,
            boxShadow: stateMachine.state === 'yellow' ? '0 0 20px yellow' : 'none'
          }} 
        />
      </div>
      
      <div>
        <button 
          onClick={handleChange}
          type="button"
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Change Light
        </button>
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'left', maxWidth: '400px', margin: '30px auto' }}>
        <h3>Current State: {stateMachine.state}</h3>
        <h3>State History:</h3>
        <ul style={{ maxHeight: '200px', overflowY: 'auto', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
          {history.map((entry, i) => (
            <li key={`history-entry-${i}`}>{entry}</li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'left', maxWidth: '400px', margin: '30px auto' }}>
        <h3>Stats:</h3>
        <ul>
          <li>All states: {stateMachine.states.join(', ')}</li>
          <li>Initial states: {stateMachine.initialStates.join(', ')}</li>
          <li>Final states: {stateMachine.finalStates.join(', ')}</li>
          <li>Valid events: {stateMachine.events.join(', ')}</li>
        </ul>
      </div>
    </div>
  );
};

export default FSMDemo; 
