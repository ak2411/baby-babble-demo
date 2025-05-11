import { useEffect } from 'react';
import coinImage from '../assets/coin.png';
import bunnyImage from '../assets/bunny.png';
import '../App.css';

function SecondPage() {
  useEffect(() => {
    // Add class when component mounts
    document.body.classList.add('second-page-body');
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('second-page-body');
    };
  }, []);

  return (
    <div className="second-page">
      <h1>Pp</h1>
      <div className="bunny-container">
        <img src={bunnyImage} alt="Cute bunny" className="bunny-image" />
      </div>
      <div className="coin-container">
        <img 
          src={coinImage} 
          alt="Floating Coin" 
          className="floating-coin"
        />
      </div>
    </div>
  );
}

export default SecondPage; 