import { useEffect, useState } from 'react';
import { createStateMachine } from 'tuple-state-machine';

// Traffic light state machine
// States: red -> green -> yellow -> red
const trafficLight = createStateMachine([
  ['red', 'change', 'green'],
  ['green', 'change', 'yellow'],
  ['yellow', 'change', 'red'],
]);

const FSMDemo: React.FC = () => {
  const [, setState] = useState(trafficLight.state);
  useEffect(() => {
    trafficLight.onChange = setState;
  }, []);
  
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
    if (trafficLight.can('change')) {
      const previousState = trafficLight.state;
      const result = await trafficLight.event('change');
      
      if (!result.error) {
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
            opacity: trafficLight.state === 'red' ? 1 : 0.3,
            boxShadow: trafficLight.state === 'red' ? '0 0 20px red' : 'none'
          }} 
        />
        <div 
          style={{ 
            ...lightStyle, 
            backgroundColor: 'green',
            opacity: trafficLight.state === 'green' ? 1 : 0.3,
            boxShadow: trafficLight.state === 'green' ? '0 0 20px green' : 'none'
          }} 
        />
        <div 
          style={{ 
            ...lightStyle, 
            backgroundColor: 'yellow',
            opacity: trafficLight.state === 'yellow' ? 1 : 0.3,
            boxShadow: trafficLight.state === 'yellow' ? '0 0 20px yellow' : 'none'
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
        <h3>Current State: {trafficLight.state}</h3>
        <h3>State History:</h3>
        <ul style={{ maxHeight: '200px', overflowY: 'auto', padding: '10px', background: '#f5f5f5', borderRadius: '4px', color: 'black' }}>
          {history.map((entry, i) => (
            <li key={`history-entry-${i}`}>{entry}</li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'left', maxWidth: '400px', margin: '30px auto' }}>
        <h3>Stats:</h3>
        <ul>
          <li>All states: {trafficLight.states.join(', ')}</li>
          <li>Initial states: {trafficLight.initialStates.join(', ')}</li>
          <li>Final states: {trafficLight.finalStates.join(', ')}</li>
          <li>Valid events: {trafficLight.events.join(', ')}</li>
        </ul>
      </div>
    </div>
  );
};

export default FSMDemo; 
