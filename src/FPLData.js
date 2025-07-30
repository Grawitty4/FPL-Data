import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from './config';

function FPLData() {
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryPlayers, setSummaryPlayers] = useState([]);
  const [detailsPlayers, setDetailsPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [positions, setPositions] = useState({});
  const [gameweeks, setGameweeks] = useState([]);
  const [selectedGameweek, setSelectedGameweek] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch gameweeks
        const gameweeksResponse = await axios.get(buildApiUrl('/api/gameweeks'));
        setGameweeks(gameweeksResponse.data);
        
        // Fetch summary data
        const summaryResponse = await axios.get(buildApiUrl('/api/stored-fpl-data'));
        setSummaryPlayers(summaryResponse.data);
        
        // Fetch details data (all gameweeks)
        const detailsResponse = await axios.get(buildApiUrl('/api/gameweek-fpl-data'));
        setDetailsPlayers(detailsResponse.data);
        
        // Create team mapping from summary data
        const teamMapping = {};
        summaryResponse.data.forEach(player => {
          if (player.team_code && player.team_name) {
            teamMapping[player.team_code] = {
              name: player.team_name,
              short_name: player.team_short_name
            };
          }
        });
        setTeams(teamMapping);
        
        // Create position mapping from summary data
        const positionMapping = {};
        summaryResponse.data.forEach(player => {
          if (player.position_id && player.position_name) {
            positionMapping[player.position_id] = player.position_name;
          }
        });
        setPositions(positionMapping);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch player data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleGameweekChange = async (gameweekId) => {
    setSelectedGameweek(gameweekId);
    setLoading(true);
    
    try {
      const url = gameweekId 
        ? buildApiUrl(`/api/gameweek-fpl-data?gameweek=${gameweekId}`)
        : buildApiUrl('/api/gameweek-fpl-data');
      
      const response = await axios.get(url);
      setDetailsPlayers(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch player data for selected gameweek');
      setLoading(false);
    }
  };

  const getSortedPlayers = () => {
    const currentPlayers = activeTab === 'summary' ? summaryPlayers : detailsPlayers;
    if (!sortConfig.key) return currentPlayers;

    return [...currentPlayers].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle special cases
      if (sortConfig.key === 'now_cost') {
        aValue = parseFloat(aValue) / 10;
        bValue = parseFloat(bValue) / 10;
      } else if (sortConfig.key === 'selected_by_percent') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig.key === 'points_per_game') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig.key === 'form') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig.key === 'value_form' || sortConfig.key === 'value_season') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig.key === 'ict_index' || sortConfig.key === 'influence' || 
                 sortConfig.key === 'creativity' || sortConfig.key === 'threat') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig.key === 'expected_goals' || sortConfig.key === 'expected_assists' ||
                 sortConfig.key === 'expected_goal_involvements' || sortConfig.key === 'expected_goals_conceded') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig.key === 'expected_goals_per_90' || sortConfig.key === 'saves_per_90' ||
                 sortConfig.key === 'expected_assists_per_90' || sortConfig.key === 'expected_goals_conceded_per_90' ||
                 sortConfig.key === 'goals_conceded_per_90' || sortConfig.key === 'clean_sheets_per_90') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = 0;
      if (bValue === null || bValue === undefined) bValue = 0;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const sortedPlayers = getSortedPlayers();

  return (
    <div className="container">
      <h1>FPL Player Analyzer</h1>
      {loading && <p>Loading player data...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!loading && !error && (
        <div>
          {/* Tabs */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
            <button
              onClick={() => setActiveTab('summary')}
              style={{
                padding: '10px 20px',
                marginRight: '5px',
                border: 'none',
                background: activeTab === 'summary' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'summary' ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '4px 4px 0 0'
              }}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('details')}
              style={{
                padding: '10px 20px',
                marginRight: '5px',
                border: 'none',
                background: activeTab === 'details' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'details' ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '4px 4px 0 0'
              }}
            >
              Details
            </button>
          </div>

          {/* Gameweek Filter - Only show in Details tab */}
          {activeTab === 'details' && (
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="gameweek-select" style={{ fontWeight: 'bold' }}>
                Filter by Gameweek:
              </label>
              <select
                id="gameweek-select"
                value={selectedGameweek}
                onChange={(e) => handleGameweekChange(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
              >
                <option value="">All Gameweeks</option>
                {gameweeks.map(gameweek => (
                  <option key={gameweek.gameweek_id} value={gameweek.gameweek_id}>
                    {gameweek.name} {gameweek.is_current && '(Current)'} {gameweek.is_next && '(Next)'}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{overflowX: 'auto'}}>
            <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('first_name')} style={{cursor: 'pointer'}}>
                  Name {getSortIcon('first_name')}
                </th>
                <th onClick={() => handleSort('team_code')} style={{cursor: 'pointer'}}>
                  Team {getSortIcon('team_code')}
                </th>
                <th onClick={() => handleSort('position_id')} style={{cursor: 'pointer'}}>
                  Position {getSortIcon('position_id')}
                </th>
                {activeTab === 'details' && (
                  <th onClick={() => handleSort('gameweek_name')} style={{cursor: 'pointer'}}>
                    Gameweek {getSortIcon('gameweek_name')}
                  </th>
                )}
                <th onClick={() => handleSort('now_cost')} style={{cursor: 'pointer'}}>
                  Price (£m) {getSortIcon('now_cost')}
                </th>
                <th onClick={() => handleSort('total_points')} style={{cursor: 'pointer'}}>
                  Points {getSortIcon('total_points')}
                </th>
                <th onClick={() => handleSort('form')} style={{cursor: 'pointer'}}>
                  Form {getSortIcon('form')}
                </th>
                <th onClick={() => handleSort('points_per_game')} style={{cursor: 'pointer'}}>
                  Points/Game {getSortIcon('points_per_game')}
                </th>
                <th onClick={() => handleSort('value_form')} style={{cursor: 'pointer'}}>
                  Value Form {getSortIcon('value_form')}
                </th>
                <th onClick={() => handleSort('value_season')} style={{cursor: 'pointer'}}>
                  Value Season {getSortIcon('value_season')}
                </th>
                <th onClick={() => handleSort('selected_by_percent')} style={{cursor: 'pointer'}}>
                  Selected By (%) {getSortIcon('selected_by_percent')}
                </th>
                <th onClick={() => handleSort('minutes')} style={{cursor: 'pointer'}}>
                  Minutes {getSortIcon('minutes')}
                </th>
                <th onClick={() => handleSort('goals_scored')} style={{cursor: 'pointer'}}>
                  Goals {getSortIcon('goals_scored')}
                </th>
                <th onClick={() => handleSort('assists')} style={{cursor: 'pointer'}}>
                  Assists {getSortIcon('assists')}
                </th>
                <th onClick={() => handleSort('clean_sheets')} style={{cursor: 'pointer'}}>
                  Clean Sheets {getSortIcon('clean_sheets')}
                </th>
                <th onClick={() => handleSort('goals_conceded')} style={{cursor: 'pointer'}}>
                  Goals Conceded {getSortIcon('goals_conceded')}
                </th>
                <th onClick={() => handleSort('own_goals')} style={{cursor: 'pointer'}}>
                  Own Goals {getSortIcon('own_goals')}
                </th>
                <th onClick={() => handleSort('penalties_saved')} style={{cursor: 'pointer'}}>
                  Penalties Saved {getSortIcon('penalties_saved')}
                </th>
                <th onClick={() => handleSort('penalties_missed')} style={{cursor: 'pointer'}}>
                  Penalties Missed {getSortIcon('penalties_missed')}
                </th>
                <th onClick={() => handleSort('yellow_cards')} style={{cursor: 'pointer'}}>
                  Yellow Cards {getSortIcon('yellow_cards')}
                </th>
                <th onClick={() => handleSort('red_cards')} style={{cursor: 'pointer'}}>
                  Red Cards {getSortIcon('red_cards')}
                </th>
                <th onClick={() => handleSort('saves')} style={{cursor: 'pointer'}}>
                  Saves {getSortIcon('saves')}
                </th>
                <th onClick={() => handleSort('bonus')} style={{cursor: 'pointer'}}>
                  Bonus {getSortIcon('bonus')}
                </th>
                <th onClick={() => handleSort('influence')} style={{cursor: 'pointer'}}>
                  Influence {getSortIcon('influence')}
                </th>
                <th onClick={() => handleSort('creativity')} style={{cursor: 'pointer'}}>
                  Creativity {getSortIcon('creativity')}
                </th>
                <th onClick={() => handleSort('threat')} style={{cursor: 'pointer'}}>
                  Threat {getSortIcon('threat')}
                </th>
                <th onClick={() => handleSort('ict_index')} style={{cursor: 'pointer'}}>
                  ICT Index {getSortIcon('ict_index')}
                </th>
                <th onClick={() => handleSort('defensive_contribution')} style={{cursor: 'pointer'}}>
                  Defensive Contribution {getSortIcon('defensive_contribution')}
                </th>
                <th onClick={() => handleSort('starts')} style={{cursor: 'pointer'}}>
                  Starts {getSortIcon('starts')}
                </th>
                <th onClick={() => handleSort('expected_goals')} style={{cursor: 'pointer'}}>
                  Expected Goals {getSortIcon('expected_goals')}
                </th>
                <th onClick={() => handleSort('expected_assists')} style={{cursor: 'pointer'}}>
                  Expected Assists {getSortIcon('expected_assists')}
                </th>
                <th onClick={() => handleSort('expected_goal_involvements')} style={{cursor: 'pointer'}}>
                  Expected Goal Involvements {getSortIcon('expected_goal_involvements')}
                </th>
                <th onClick={() => handleSort('expected_goals_conceded')} style={{cursor: 'pointer'}}>
                  Expected Goals Conceded {getSortIcon('expected_goals_conceded')}
                </th>
                <th onClick={() => handleSort('expected_goals_per_90')} style={{cursor: 'pointer'}}>
                  Expected Goals/90 {getSortIcon('expected_goals_per_90')}
                </th>
                <th onClick={() => handleSort('saves_per_90')} style={{cursor: 'pointer'}}>
                  Saves/90 {getSortIcon('saves_per_90')}
                </th>
                <th onClick={() => handleSort('expected_assists_per_90')} style={{cursor: 'pointer'}}>
                  Expected Assists/90 {getSortIcon('expected_assists_per_90')}
                </th>
                <th onClick={() => handleSort('expected_goals_conceded_per_90')} style={{cursor: 'pointer'}}>
                  Expected Goals Conceded/90 {getSortIcon('expected_goals_conceded_per_90')}
                </th>
                <th onClick={() => handleSort('goals_conceded_per_90')} style={{cursor: 'pointer'}}>
                  Goals Conceded/90 {getSortIcon('goals_conceded_per_90')}
                </th>
                <th onClick={() => handleSort('clean_sheets_per_90')} style={{cursor: 'pointer'}}>
                  Clean Sheets/90 {getSortIcon('clean_sheets_per_90')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map(player => (
                <tr key={player.id}>
                  <td>{player.first_name} {player.second_name}</td>
                  <td>{teams[player.team_code]?.name || player.team_code}</td>
                  <td>{positions[player.position_id] || player.position_name || 'N/A'}</td>
                  {activeTab === 'details' && (
                    <td>{player.gameweek_name || 'N/A'}</td>
                  )}
                  <td>{(player.now_cost / 10).toFixed(1)}</td>
                  <td>{player.total_points}</td>
                  <td>{player.form}</td>
                  <td>{player.points_per_game}</td>
                  <td>{player.value_form}</td>
                  <td>{player.value_season}</td>
                  <td>{player.selected_by_percent}</td>
                  <td>{player.minutes}</td>
                  <td>{player.goals_scored}</td>
                  <td>{player.assists}</td>
                  <td>{player.clean_sheets}</td>
                  <td>{player.goals_conceded}</td>
                  <td>{player.own_goals}</td>
                  <td>{player.penalties_saved}</td>
                  <td>{player.penalties_missed}</td>
                  <td>{player.yellow_cards}</td>
                  <td>{player.red_cards}</td>
                  <td>{player.saves}</td>
                  <td>{player.bonus}</td>
                  <td>{player.influence}</td>
                  <td>{player.creativity}</td>
                  <td>{player.threat}</td>
                  <td>{player.ict_index}</td>
                  <td>{player.defensive_contribution}</td>
                  <td>{player.starts}</td>
                  <td>{player.expected_goals}</td>
                  <td>{player.expected_assists}</td>
                  <td>{player.expected_goal_involvements}</td>
                  <td>{player.expected_goals_conceded}</td>
                  <td>{player.expected_goals_per_90}</td>
                  <td>{player.saves_per_90}</td>
                  <td>{player.expected_assists_per_90}</td>
                  <td>{player.expected_goals_conceded_per_90}</td>
                  <td>{player.goals_conceded_per_90}</td>
                  <td>{player.clean_sheets_per_90}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}

export default FPLData; 