import { useState } from 'react'
import FSMDemo from './components/FSMDemo'
import DocumentWorkflow from './components/DocumentWorkflow'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'traffic-light' | 'document-workflow'>('traffic-light')

  return (
    <>
      <h1>Tuple State Machine Demo</h1>
      
      <div className="tabs">
        <button 
          type="button"
          className={activeTab === 'traffic-light' ? 'active' : ''} 
          onClick={() => setActiveTab('traffic-light')}
        >
          Traffic Light Example
        </button>
        <button 
          type="button"
          className={activeTab === 'document-workflow' ? 'active' : ''} 
          onClick={() => setActiveTab('document-workflow')}
        >
          Document Workflow
        </button>
      </div>

      <div className="card">
        {activeTab === 'traffic-light' ? <FSMDemo /> : <DocumentWorkflow />}
      </div>
      
      <p className="read-the-docs">
        A demonstration of tuple-state-machine library
      </p>
      
      <style>{`
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .tabs button {
          padding: 10px 20px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s;
        }
        
        .tabs button.active {
          border-bottom: 2px solid #646cff;
          color: #646cff;
        }
        
        .tabs button:hover {
          color: #535bf2;
        }
      `}</style>
    </>
  )
}

export default App
