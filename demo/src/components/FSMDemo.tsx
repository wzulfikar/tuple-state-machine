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
    <div className="text-center py-5">
      <h2 className="text-2xl font-bold mb-6">Traffic Light State Machine</h2>
      
      <div className="my-8 relative flex justify-center">
        {/* Traffic light cabinet with pole */}
        <div className="relative">
          {/* Pole */}
          <div className="w-8 h-52 bg-gray-800 mx-auto rounded-b"></div>
          
          {/* Base */}
          <div className="w-24 h-5 bg-gray-800 mx-auto rounded-full -mt-1"></div>
          
          {/* Traffic Light Housing */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black p-4 rounded-xl flex flex-col gap-4 items-center shadow-lg border-4 border-gray-800">
            <div 
              className={`w-20 h-20 rounded-full transition-all duration-300 bg-red-600 ${
                trafficLight.state === 'red' ? 'opacity-100 shadow-[0_0_20px_red]' : 'opacity-30'
              }`}
            />
            <div 
              className={`w-20 h-20 rounded-full transition-all duration-300 bg-yellow-500 ${
                trafficLight.state === 'yellow' ? 'opacity-100 shadow-[0_0_20px_yellow]' : 'opacity-30'
              }`}
            />
            <div 
              className={`w-20 h-20 rounded-full transition-all duration-300 bg-green-600 ${
                trafficLight.state === 'green' ? 'opacity-100 shadow-[0_0_20px_green]' : 'opacity-30'
              }`}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-16">
        <button 
          onClick={handleChange}
          type="button"
          className="px-5 py-2.5 text-base bg-green-600 text-white border-none rounded cursor-pointer"
        >
          Change Light
        </button>
      </div>
      
      <div className="mt-8 text-left max-w-md mx-auto">
        <h3 className="text-xl font-semibold">Current State: {trafficLight.state}</h3>
        <h3 className="text-xl font-semibold mt-4">State History:</h3>
        <ul className="max-h-[200px] overflow-y-auto p-2.5 bg-gray-100 dark:bg-gray-800 rounded text-black dark:text-white">
          {history.map((entry, i) => (
            <li key={`history-entry-${i}`} className="py-1">{entry}</li>
          ))}
        </ul>
      </div>
      
      <div className="mt-8 text-left max-w-md mx-auto">
        <h3 className="text-xl font-semibold">Stats:</h3>
        <ul className="list-disc pl-5">
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
