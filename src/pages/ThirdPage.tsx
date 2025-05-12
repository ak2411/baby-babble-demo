import { useNavigate } from 'react-router-dom';
import coinImage from '../assets/coin.png';
import '../App.css';
import { useEffect } from 'react';

function ThirdPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Add class when component mounts
    document.body.classList.add('third-page-body');
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('third-page-body');
    };
  }, []);

  return (
    <div className="third-page">
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Back
      </button>
      <div className="token-circles">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="token-circle">
            {index === 0 && (
              <div className="coin-container">
                <img 
                  src={coinImage}
                  alt="Click to record" 
                  className="coin"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThirdPage; 