import { useEffect, useState } from 'react';
import { createStateMachine } from 'tuple-state-machine';

// Document workflow state machine
// draft -> review -> approved/rejected -> published (if approved)
const documentWorkflow = createStateMachine([
  ['draft', 'submit', 'in_review', () => console.log('Document submitted for review')],
  ['in_review', 'approve', 'approved', () => console.log('Document approved')],
  ['in_review', 'reject', 'rejected', () => console.log('Document rejected')],
  ['approved', 'publish', 'published', () => console.log('Document published')],
  ['rejected', 'revise', 'draft', () => console.log('Document back to draft for revision')],
  ['published', 'reset', 'draft', () => console.log('Document reset to draft')],
]);

const DocumentWorkflow: React.FC = () => {  
  const [, setState] = useState(documentWorkflow.state);
  useEffect(() => {
    documentWorkflow.onChange = setState;
  }, []);
  
  const [history, setHistory] = useState<string[]>(['Started at: draft']);
  const [comments, setComments] = useState<string>('');

  const handleEvent = async (event: typeof documentWorkflow.events[number]) => {
    if (documentWorkflow.can(event)) {
      const previousState = documentWorkflow.state;
      const result = await documentWorkflow.event(event, { comments });
      
      if (!result.error) {
        setHistory(prev => [...prev, `${previousState} → ${result.state} (${event})`]);
      } else {
        setHistory(prev => [...prev, `Error: ${result.error}`]);
      }
    }
  };

  const getAvailableButtons = () => {
    const buttons = [];
    
    if (documentWorkflow.state === 'draft' && documentWorkflow.can('submit')) {
      buttons.push(
        <button
          key="submit"
          type="button"
          onClick={() => handleEvent('submit')}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:opacity-90 hover:-translate-y-0.5 transition-all"
        >
          Submit for Review
        </button>
      );
    }
    
    if (documentWorkflow.state === 'in_review') {
      if (documentWorkflow.can('approve')) {
        buttons.push(
          <button
            key="approve"
            type="button"
            onClick={() => handleEvent('approve')}
            className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:opacity-90 hover:-translate-y-0.5 transition-all"
          >
            Approve
          </button>
        );
      }
      
      if (documentWorkflow.can('reject')) {
        buttons.push(
          <button
            key="reject"
            type="button"
            onClick={() => handleEvent('reject')}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:opacity-90 hover:-translate-y-0.5 transition-all"
          >
            Reject
          </button>
        );
      }
    }

    if (documentWorkflow.can('reset')) {
      buttons.push(
        <button
          key="reset"
          type="button"
          onClick={() => handleEvent('reset')}
          className="px-4 py-2 bg-orange-500 text-white font-bold rounded hover:opacity-90 hover:-translate-y-0.5 transition-all"
        >
          Reset
        </button>
      );
    }
    
    if (documentWorkflow.state === 'approved' && documentWorkflow.can('publish')) {
      buttons.push(
        <button
          key="publish"
          type="button"
          onClick={() => handleEvent('publish')}
          className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:opacity-90 hover:-translate-y-0.5 transition-all"
        >
          Publish
        </button>
      );
    }
    
    if (documentWorkflow.state === 'rejected' && documentWorkflow.can('revise')) {
      buttons.push(
        <button
          key="revise"
          type="button"
          onClick={() => handleEvent('revise')}
          className="px-4 py-2 bg-orange-500 text-white font-bold rounded hover:opacity-90 hover:-translate-y-0.5 transition-all"
        >
          Revise
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="max-w-2xl mx-auto py-5">
      <h2 className="text-2xl font-bold mb-6">Document Workflow State Machine</h2>
      
      <div className="flex justify-between mb-10 relative">
        {['draft', 'in_review', 'approved', 'published', 'rejected'].map((state) => (
          <div 
            key={state}
            className={`w-20 py-2 px-3 text-center rounded-lg ${
              documentWorkflow.state === state 
                ? 'bg-green-600 text-white font-bold' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            } z-10`}
          >
            {state}
          </div>
        ))}
        
        {/* Progress line */}
        <div className="absolute h-1 bg-gray-300 dark:bg-gray-600 top-1/2 left-10 right-10 -translate-y-1/2 z-0" />
      </div>
      
      <div className="mb-5">
        <h3 className="text-xl font-semibold">Current State: <span className="text-green-600">{documentWorkflow.state}</span></h3>
        
        <div className="mt-5">
          <label htmlFor="comments" className="block mb-2 font-medium">
            Comments:
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 min-h-[80px] bg-white dark:bg-gray-800"
          />
        </div>
        
        <div className="flex flex-wrap gap-2.5 mt-5">
          {getAvailableButtons()}
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">State History:</h3>
        <ul className="max-h-[200px] overflow-y-auto p-4 bg-gray-100 dark:bg-gray-800 rounded list-none">
          {history.map((entry, i) => (
            <li 
              key={`history-${i}`}
              className={`py-2 ${
                i < history.length - 1 ? 'border-b border-gray-300 dark:border-gray-700' : ''
              }`}
            >
              {entry}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DocumentWorkflow; 
