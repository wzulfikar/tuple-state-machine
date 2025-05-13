import { useState } from 'react'
import FSMDemo from './components/FSMDemo'
import DocumentWorkflow from './components/DocumentWorkflow'

function App() {
  const [activeTab, setActiveTab] = useState<'traffic-light' | 'document-workflow'>('traffic-light')

  return (
    <div className="max-w-5xl mx-auto p-8 text-center">
      <h1 className="mb-6">Tuple State Machine Demo</h1>
      
      <div className="flex gap-4 mb-6">
        <button 
          type="button"
          className={`bg-transparent border-b-2 ${activeTab === 'traffic-light' ? 'border-[#646cff] text-[#646cff]' : 'border-transparent'} px-5 py-2.5 text-base transition-all duration-300 hover:text-[#535bf2]`} 
          onClick={() => setActiveTab('traffic-light')}
        >
          Traffic Light Example
        </button>
        <button 
          type="button"
          className={`bg-transparent border-b-2 ${activeTab === 'document-workflow' ? 'border-[#646cff] text-[#646cff]' : 'border-transparent'} px-5 py-2.5 text-base transition-all duration-300 hover:text-[#535bf2]`} 
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
    </div>
  )
}

export default App
