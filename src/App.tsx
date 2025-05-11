import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    // Add class when component mounts
    document.body.classList.add('home-page-body');
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('home-page-body');
    };
  }, []);

  return (
    <div className="home-page">
      <button 
        onClick={() => navigate('/second-page')} 
        className="go-button"
      >
        Start
      </button>
    </div>
  )
}

export default App
