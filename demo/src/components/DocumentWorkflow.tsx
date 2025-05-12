import { useState } from 'react';
import { createStateMachine } from 'tuple-state-machine';

// Document workflow state machine
// draft -> review -> approved/rejected -> published (if approved)
const documentWorkflowTransitions = [
  ['draft', 'submit', 'review', () => console.log('Document submitted for review')],
  ['review', 'approve', 'approved', () => console.log('Document approved')],
  ['review', 'reject', 'rejected', () => console.log('Document rejected')],
  ['approved', 'publish', 'published', () => console.log('Document published')],
  ['rejected', 'revise', 'draft', () => console.log('Document back to draft for revision')],
] as const;

const DocumentWorkflow: React.FC = () => {
  const [stateMachine, setStateMachine] = useState(() => 
    createStateMachine(documentWorkflowTransitions, 'draft')
  );
  
  const [history, setHistory] = useState<string[]>(['Started at: draft']);
  const [comments, setComments] = useState<string>('');

  const handleEvent = async (event: 'submit' | 'approve' | 'reject' | 'publish' | 'revise') => {
    if (stateMachine.can(event)) {
      const previousState = stateMachine.state;
      const result = await stateMachine.event(event, { comments });
      
      if (!result.error) {
        setStateMachine({ ...stateMachine }); // Force re-render with updated state
        setHistory(prev => [...prev, `${previousState} → ${result.state} (${event})`]);
      } else {
        setHistory(prev => [...prev, `Error: ${result.error}`]);
      }
    }
  };

  const getAvailableButtons = () => {
    const buttons = [];
    
    if (stateMachine.state === 'draft' && stateMachine.can('submit')) {
      buttons.push(
        <button
          key="submit"
          type="button"
          onClick={() => handleEvent('submit')}
          className="action-btn primary"
        >
          Submit for Review
        </button>
      );
    }
    
    if (stateMachine.state === 'review') {
      if (stateMachine.can('approve')) {
        buttons.push(
          <button
            key="approve"
            type="button"
            onClick={() => handleEvent('approve')}
            className="action-btn success"
          >
            Approve
          </button>
        );
      }
      
      if (stateMachine.can('reject')) {
        buttons.push(
          <button
            key="reject"
            type="button"
            onClick={() => handleEvent('reject')}
            className="action-btn danger"
          >
            Reject
          </button>
        );
      }
    }
    
    if (stateMachine.state === 'approved' && stateMachine.can('publish')) {
      buttons.push(
        <button
          key="publish"
          type="button"
          onClick={() => handleEvent('publish')}
          className="action-btn success"
        >
          Publish
        </button>
      );
    }
    
    if (stateMachine.state === 'rejected' && stateMachine.can('revise')) {
      buttons.push(
        <button
          key="revise"
          type="button"
          onClick={() => handleEvent('revise')}
          className="action-btn warning"
        >
          Revise
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Document Workflow State Machine</h2>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        margin: '40px 0',
        position: 'relative'
      }}>
        {['draft', 'review', 'approved', 'published', 'rejected'].map((state, index) => (
          <div 
            key={state}
            style={{
              width: '80px',
              padding: '10px',
              textAlign: 'center',
              borderRadius: '8px',
              backgroundColor: stateMachine.state === state ? '#4CAF50' : '#f0f0f0',
              color: stateMachine.state === state ? 'white' : '#333',
              fontWeight: stateMachine.state === state ? 'bold' : 'normal',
              position: 'relative',
              zIndex: 10
            }}
          >
            {state}
          </div>
        ))}
        
        {/* Progress line */}
        <div style={{
          position: 'absolute',
          height: '4px',
          backgroundColor: '#ddd',
          top: '50%',
          left: '40px',
          right: '40px',
          zIndex: 5
        }} />
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <h3>Current State: <span style={{ color: '#4CAF50' }}>{stateMachine.state}</span></h3>
        
        <div style={{ marginTop: '20px' }}>
          <label htmlFor="comments" style={{ display: 'block', marginBottom: '8px' }}>
            Comments:
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              minHeight: '80px'
            }}
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginTop: '20px',
          flexWrap: 'wrap'
        }}>
          {getAvailableButtons()}
        </div>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>State History:</h3>
        <ul style={{ 
          maxHeight: '200px', 
          overflowY: 'auto', 
          padding: '15px', 
          background: '#f5f5f5', 
          borderRadius: '4px',
          listStyleType: 'none'
        }}>
          {history.map((entry, i) => (
            <li 
              key={`history-${i}`}
              style={{
                padding: '8px 0',
                borderBottom: i < history.length - 1 ? '1px solid #ddd' : 'none'
              }}
            >
              {entry}
            </li>
          ))}
        </ul>
      </div>
      
      <style>{`
        .action-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s;
        }
        
        .action-btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        
        .primary { background-color: #2196F3; color: white; }
        .success { background-color: #4CAF50; color: white; }
        .danger { background-color: #F44336; color: white; }
        .warning { background-color: #FF9800; color: white; }
      `}</style>
    </div>
  );
};

export default DocumentWorkflow; 
