import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

function Analysis({ players, teams, positions }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [clickedCoordinates, setClickedCoordinates] = useState(null);
  const [playersAtClickedPoint, setPlayersAtClickedPoint] = useState([]);
  const [debugCounter, setDebugCounter] = useState(0);

  // Classify players based on starts
  const classifyPlayers = (players) => {
    return players.map(player => {
      const starts = parseInt(player.starts) || 0;
      let category = 'benchwarmers';
      
      if (starts >= 30 && starts <= 38) {
        category = 'regular_starters';
      } else if (starts >= 21 && starts <= 29) {
        category = 'benchers';
      } else if (starts >= 11 && starts <= 20) {
        category = 'backbenchers';
      } else if (starts >= 1 && starts <= 10) {
        category = 'benchwarmers';
      }
      
      return {
        ...player,
        category,
        playerName: `${player.first_name} ${player.second_name}`,
        price: parseFloat(player.now_cost) / 10,
        points: parseInt(player.total_points) || 0
      };
    });
  };

  useEffect(() => {
    if (players && players.length > 0) {
      console.log('Analysis component received players:', players.length);
      console.log('Sample players:', players.slice(0, 3));
      
      // Check for duplicates
      const fplIds = players.map(p => p.fpl_id);
      const uniqueIds = new Set(fplIds);
      console.log('Unique FPL IDs:', uniqueIds.size, 'Total players:', players.length);
      
      if (fplIds.length !== uniqueIds.size) {
        console.warn('DUPLICATE PLAYERS DETECTED!');
        const duplicates = fplIds.filter((id, index) => fplIds.indexOf(id) !== index);
        console.log('Duplicate FPL IDs:', [...new Set(duplicates)]);
      }
      
      const classifiedPlayers = classifyPlayers(players);
      setFilteredPlayers(classifiedPlayers);
    }
  }, [players]);

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('🔄 clickedCoordinates changed:', clickedCoordinates);
  }, [clickedCoordinates]);

  useEffect(() => {
    console.log('🔄 playersAtClickedPoint changed:', playersAtClickedPoint);
  }, [playersAtClickedPoint]);

  const getCategoryPlayers = (category) => {
    let players = filteredPlayers;
    
    if (category !== 'all') {
      players = players.filter(player => player.category === category);
    }
    
    if (selectedPosition !== 'all') {
      players = players.filter(player => player.position_id === parseInt(selectedPosition));
    }
    
    return players;
  };

  const getCategoryCounts = () => {
    const counts = {
      regular_starters: 0,
      benchers: 0,
      backbenchers: 0,
      benchwarmers: 0
    };
    
    filteredPlayers.forEach(player => {
      counts[player.category]++;
    });
    
    return counts;
  };

  const categoryCounts = getCategoryCounts();
  const displayPlayers = getCategoryPlayers(selectedCategory);
  
  // Debug: Check for duplicates in displayPlayers
  console.log('Display players count:', displayPlayers.length);
  const displayFplIds = displayPlayers.map(p => p.fpl_id);
  const uniqueDisplayIds = new Set(displayFplIds);
  console.log('Unique display FPL IDs:', uniqueDisplayIds.size, 'Total display players:', displayPlayers.length);
  
  if (displayFplIds.length !== uniqueDisplayIds.size) {
    console.warn('DUPLICATE PLAYERS IN DISPLAY!');
    const duplicates = displayFplIds.filter((id, index) => displayFplIds.indexOf(id) !== index);
    console.log('Duplicate FPL IDs in display:', [...new Set(duplicates)]);
    
    // Show which players are duplicated
    const duplicatePlayers = displayPlayers.filter(player => 
      displayFplIds.filter(id => id === player.fpl_id).length > 1
    );
    console.log('Duplicate players details:', duplicatePlayers.map(p => ({
      name: p.playerName,
      fpl_id: p.fpl_id,
      category: p.category,
      position_id: p.position_id
    })));
  }
  
  // Function to get players at specific coordinates
  const getPlayersAtCoordinates = (x, y) => {
    console.log('🔍 getPlayersAtCoordinates called with:', x, y);
    console.log('🔍 displayPlayers available:', displayPlayers.length);
    const found = displayPlayers.filter(player => 
      Math.abs(player.price - x) < 0.1 && Math.abs(player.points - y) < 0.1
    );
    console.log('🔍 Found players:', found);
    return found;
  };

  // Handle chart click
  const handleChartClick = (event, elements) => {
    console.log('🎯 Chart clicked!', event, elements);
    console.log('Event type:', event.type);
    console.log('Elements:', elements);
    
    if (elements && elements.length > 0) {
      const element = elements[0];
      const dataPoint = element.raw;
      console.log('✅ Data point clicked:', dataPoint);
      
      const playersAtPoint = getPlayersAtCoordinates(dataPoint.x, dataPoint.y);
      console.log('🔍 Players at this point:', playersAtPoint);
      
      console.log('🔄 Setting state...');
      setClickedCoordinates({ x: dataPoint.x, y: dataPoint.y });
      setPlayersAtClickedPoint(playersAtPoint);
      
      console.log(`📍 Clicked on point: £${dataPoint.x}m, ${dataPoint.y} pts`);
      console.log(`👥 Found ${playersAtPoint.length} players at this point`);
    } else {
      console.log('❌ No elements found in click event');
      console.log('Event details:', event);
    }
  };

  // Debug: Log function definition
  console.log('🔧 handleChartClick function defined:', typeof handleChartClick);
  console.log('🔧 handleChartClick function:', handleChartClick);

  // Get unique positions for filter
  const uniquePositions = Object.entries(positions).map(([id, name]) => ({
    id: parseInt(id),
    name: name
  }));
  
  // Debug: Check positions object
  console.log('Positions object:', positions);
  console.log('Unique positions:', uniquePositions);
  console.log('Positions object keys:', Object.keys(positions));
  console.log('Positions object values:', Object.values(positions));

  // Calculate median values for quadrant lines
  const medianPrice = displayPlayers.length > 0 ? 
    displayPlayers.sort((a, b) => a.price - b.price)[Math.floor(displayPlayers.length / 2)].price : 0;
  const medianPoints = displayPlayers.length > 0 ? 
    displayPlayers.sort((a, b) => a.points - b.points)[Math.floor(displayPlayers.length / 2)].points : 0;

  // Prepare data for ROI scatter plot
  const chartData = {
    datasets: [
      {
        label: 'Players',
        data: displayPlayers.map((player, index) => ({
          x: player.price,
          y: player.points,
          playerName: player.playerName,
          team: teams[player.team_code]?.name || player.team_code,
          position: positions[player.position_id] || 'N/A',
          category: player.category,
          fpl_id: player.fpl_id, // Add unique identifier
          index: index // Add index for uniqueness
        })),
        backgroundColor: displayPlayers.map(player => {
          switch (player.category) {
            case 'regular_starters': return 'rgba(34, 197, 94, 0.7)'; // Green
            case 'benchers': return 'rgba(59, 130, 246, 0.7)'; // Blue
            case 'backbenchers': return 'rgba(245, 158, 11, 0.7)'; // Orange
            case 'benchwarmers': return 'rgba(239, 68, 68, 0.7)'; // Red
            default: return 'rgba(156, 163, 175, 0.7)'; // Gray
          }
        }),
        borderColor: displayPlayers.map(player => {
          switch (player.category) {
            case 'regular_starters': return 'rgb(34, 197, 94)';
            case 'benchers': return 'rgb(59, 130, 246)';
            case 'backbenchers': return 'rgb(245, 158, 11)';
            case 'benchwarmers': return 'rgb(239, 68, 68)';
            default: return 'rgb(156, 163, 175)';
          }
        }),
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      axis: 'xy',
      intersect: false
    },
    onClick: handleChartClick,
    plugins: {
      title: {
        display: true,
        text: 'ROI Index: Player Points vs Price',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        enabled: false
      },
      legend: {
        display: false
      },
      annotation: {
        annotations: {
          // Vertical line for median price
          verticalLine: {
            type: 'line',
            xMin: medianPrice,
            xMax: medianPrice,
            borderColor: 'rgba(0, 0, 0, 0.3)',
            borderWidth: 1,
            borderDash: [5, 5]
          },
          // Horizontal line for median points
          horizontalLine: {
            type: 'line',
            yMin: medianPoints,
            yMax: medianPoints,
            borderColor: 'rgba(0, 0, 0, 0.3)',
            borderWidth: 1,
            borderDash: [5, 5]
          },
          // Quadrant labels
          q1Label: {
            type: 'label',
            xValue: medianPrice + (medianPrice * 0.25),
            yValue: medianPoints + (medianPoints * 0.25),
            content: ['High Price', 'High Points'],
            font: {
              size: 12,
              weight: 'bold'
            },
            color: 'rgba(0, 0, 0, 0.7)'
          },
          q2Label: {
            type: 'label',
            xValue: medianPrice - (medianPrice * 0.25),
            yValue: medianPoints + (medianPoints * 0.25),
            content: ['Low Price', 'High Points'],
            font: {
              size: 12,
              weight: 'bold'
            },
            color: 'rgba(0, 0, 0, 0.7)'
          },
          q3Label: {
            type: 'label',
            xValue: medianPrice - (medianPrice * 0.25),
            yValue: medianPoints - (medianPoints * 0.25),
            content: ['Low Price', 'Low Points'],
            font: {
              size: 12,
              weight: 'bold'
            },
            color: 'rgba(0, 0, 0, 0.7)'
          },
          q4Label: {
            type: 'label',
            xValue: medianPrice + (medianPrice * 0.25),
            yValue: medianPoints - (medianPoints * 0.25),
            content: ['High Price', 'Low Points'],
            font: {
              size: 12,
              weight: 'bold'
            },
            color: 'rgba(0, 0, 0, 0.7)'
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Player Price (£m)',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          callback: function(value) {
            return '£' + value + 'm';
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Total Points',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="analysis-container">
      <h2>Player Analysis</h2>
      
      {/* Category Filter */}
      <div className="category-filter">
        <h3>Player Classification</h3>
        <div className="category-buttons">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            All Players ({filteredPlayers.length})
          </button>
          <button
            onClick={() => setSelectedCategory('regular_starters')}
            className={`category-btn ${selectedCategory === 'regular_starters' ? 'active' : ''}`}
          >
            Regular Starters ({categoryCounts.regular_starters})
          </button>
          <button
            onClick={() => setSelectedCategory('benchers')}
            className={`category-btn ${selectedCategory === 'benchers' ? 'active' : ''}`}
          >
            Benchers ({categoryCounts.benchers})
          </button>
          <button
            onClick={() => setSelectedCategory('backbenchers')}
            className={`category-btn ${selectedCategory === 'backbenchers' ? 'active' : ''}`}
          >
            Backbenchers ({categoryCounts.backbenchers})
          </button>
          <button
            onClick={() => setSelectedCategory('benchwarmers')}
            className={`category-btn ${selectedCategory === 'benchwarmers' ? 'active' : ''}`}
          >
            Benchwarmers ({categoryCounts.benchwarmers})
          </button>
        </div>
        
        {/* Position Filter */}
        <div className="position-filter">
          <label htmlFor="position-select" style={{ fontWeight: 'bold', marginRight: '10px' }}>
            Filter by Position:
          </label>
          <select
            id="position-select"
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">All Positions</option>
            {uniquePositions.map(position => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="category-legend">
          <div className="legend-item">
            <span className="legend-color" style={{backgroundColor: 'rgba(34, 197, 94, 0.7)'}}></span>
            <span>Regular Starters (30-38 games)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{backgroundColor: 'rgba(59, 130, 246, 0.7)'}}></span>
            <span>Benchers (21-29 games)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{backgroundColor: 'rgba(245, 158, 11, 0.7)'}}></span>
            <span>Backbenchers (11-20 games)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{backgroundColor: 'rgba(239, 68, 68, 0.7)'}}></span>
            <span>Benchwarmers (1-10 games)</span>
          </div>
        </div>
      </div>

      {/* ROI Chart */}
      <div className="chart-container">
        <div style={{ height: '500px', width: '100%' }}>
          <Scatter data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Players in Selected Category */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">
          Players in Selected Category
          {clickedCoordinates && playersAtClickedPoint.length > 0 && (
            <span className="ml-2 text-sm text-blue-600">
              (Showing {playersAtClickedPoint.length} players at clicked point)
            </span>
          )}
        </h3>
        
        {/* Debug: Test button */}
        <div className="mb-4 p-2 bg-gray-100 border rounded text-sm">
          <button 
            onClick={() => {
              console.log('Test button clicked');
              console.log('Current clickedCoordinates:', clickedCoordinates);
              console.log('Current playersAtClickedPoint:', playersAtClickedPoint);
              console.log('displayPlayers count:', displayPlayers.length);
            }}
            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-xs"
          >
            🐛 Debug: Check State
          </button>
          <button 
            onClick={() => {
              console.log('Force state update test');
              setClickedCoordinates({ x: 5.5, y: 45 });
              setPlayersAtClickedPoint(displayPlayers.slice(0, 3));
            }}
            className="ml-2 px-3 py-1 bg-red-300 hover:bg-red-400 rounded text-xs"
          >
            🔴 Force State Test
          </button>
          <button 
            onClick={() => {
              console.log('Increment counter');
              setDebugCounter(prev => prev + 1);
            }}
            className="ml-2 px-3 py-1 bg-green-300 hover:bg-green-400 rounded text-xs"
          >
            🟢 Counter: {debugCounter}
          </button>
          <span className="ml-2 text-gray-600">
            Clicked: {clickedCoordinates ? `£${clickedCoordinates.x}m, ${clickedCoordinates.y}pts` : 'None'} | 
            Players at point: {playersAtClickedPoint.length}
          </span>
        </div>
        
        {clickedCoordinates && playersAtClickedPoint.length > 0 && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            📍 £{clickedCoordinates.x}m, {clickedCoordinates.y} pts
            <button 
              onClick={() => {
                setClickedCoordinates(null);
                setPlayersAtClickedPoint([]);
              }}
              className="ml-2 px-2 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded"
            >
              ✕ Clear
            </button>
          </div>
        )}
        
        <div className="player-list">
          <div className="player-grid">
            {(clickedCoordinates && playersAtClickedPoint.length > 0 ? playersAtClickedPoint : displayPlayers).map(player => (
              <div key={player.id} className="player-card">
                <h4>{player.playerName}</h4>
                <p><strong>Team:</strong> {teams[player.team_code]?.name || player.team_code}</p>
                <p><strong>Position:</strong> {positions[player.position_id] || 'N/A'}</p>
                <p><strong>Price:</strong> £{player.price}m</p>
                <p><strong>Points:</strong> {player.points}</p>
                <p><strong>Starts:</strong> {player.starts}</p>
                <p><strong>Category:</strong> {player.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analysis; 