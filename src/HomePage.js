import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const [bugPosition, setBugPosition] = useState({ x: 50, y: 50 });
  const [isSquashed, setIsSquashed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hammerSquashing, setHammerSquashing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const moveBug = () => {
      setBugPosition({
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 200) + 100 // Keep bug below title area
      });
    };

    const interval = setInterval(moveBug, 4000); // Slowed down to 4 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Check if hammer is close to bug for squashing
      const distance = Math.sqrt(
        Math.pow(e.clientX - bugPosition.x, 2) + 
        Math.pow(e.clientY - bugPosition.y, 2)
      );
      
      if (distance < 30 && !isSquashed && !hammerSquashing) {
        setHammerSquashing(true);
        setIsSquashed(true);
        setTimeout(() => {
          navigate('/fpl-data');
        }, 1000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [bugPosition, isSquashed, hammerSquashing, navigate]);

  const handleBugClick = () => {
    if (!isSquashed) {
      setIsSquashed(true);
      setTimeout(() => {
        navigate('/fpl-data');
      }, 1000);
    }
  };

  return (
    <div className="homepage">
      <div className="header">
        <h1>FPL Player Analyzer</h1>
        <p className="caption">Fix the bug to access the data</p>
      </div>
      
      <div 
        className={`ant ${isSquashed ? 'squashed' : ''}`}
        style={{
          left: `${bugPosition.x}px`,
          top: `${bugPosition.y}px`
        }}
        onClick={handleBugClick}
      >
        🐜
      </div>

      <div 
        className={`hammer ${hammerSquashing ? 'squashing' : ''}`}
        style={{
          left: `${mousePosition.x - 20}px`,
          top: `${mousePosition.y - 20}px`
        }}
      >
        🔨
      </div>

      {isSquashed && (
        <div className="squash-effect">
          💥
        </div>
      )}
    </div>
  );
}

export default HomePage; 