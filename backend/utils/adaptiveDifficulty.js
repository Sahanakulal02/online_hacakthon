/**
 * ADAPTIVE DIFFICULTY ENGINE (AI SIMULATION)
 * 
 * Rule-based logic that adjusts quiz difficulty based on student performance
 * 
 * Rules:
 * 1. Increase difficulty if accuracy > 80% AND average time < threshold
 * 2. Decrease difficulty if accuracy < 40%
 * 3. Otherwise keep same difficulty
 * 
 * @param {Object} params - Performance parameters
 * @param {number} params.accuracy - Current accuracy percentage (0-100)
 * @param {number} params.averageTime - Average time per question in seconds
 * @param {string} params.currentDifficulty - Current difficulty level ('easy', 'medium', 'hard')
 * @param {number} params.timeThreshold - Time threshold in seconds (default: 20)
 * @returns {string} - New difficulty level ('easy', 'medium', 'hard')
 */

const getNextDifficulty = ({ 
  accuracy, 
  averageTime, 
  currentDifficulty = 'medium',
  timeThreshold = 20 
}) => {
  // Validate inputs
  if (accuracy < 0 || accuracy > 100) {
    throw new Error('Accuracy must be between 0 and 100');
  }

  const difficulties = ['easy', 'medium', 'hard'];
  const currentIndex = difficulties.indexOf(currentDifficulty);
  
  if (currentIndex === -1) {
    throw new Error('Invalid difficulty level');
  }

  // Rule 1: Increase difficulty if performing well
  if (accuracy > 80 && averageTime < timeThreshold) {
    if (currentIndex < difficulties.length - 1) {
      return difficulties[currentIndex + 1];
    }
    return currentDifficulty; // Already at max difficulty
  }

  // Rule 2: Decrease difficulty if struggling
  if (accuracy < 40) {
    if (currentIndex > 0) {
      return difficulties[currentIndex - 1];
    }
    return currentDifficulty; // Already at min difficulty
  }

  // Rule 3: Keep same difficulty
  return currentDifficulty;
};

/**
 * Calculate points with difficulty multiplier
 * @param {boolean} isCorrect - Whether answer is correct
 * @param {string} difficulty - Difficulty level
 * @param {number} basePoints - Base points for question
 * @param {number} timeTaken - Time taken in seconds
 * @param {number} timeLimit - Time limit in seconds
 * @returns {number} - Points earned
 */
const calculatePoints = (isCorrect, difficulty, basePoints = 10, timeTaken = 0, timeLimit = 30) => {
  if (!isCorrect) return 0;

  const difficultyMultipliers = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0
  };

  const multiplier = difficultyMultipliers[difficulty] || 1.0;
  let points = basePoints * multiplier;

  // Time bonus: faster answers get bonus points (up to 20% bonus)
  const timeRatio = timeTaken / timeLimit;
  if (timeRatio < 0.5) {
    const timeBonus = (1 - timeRatio) * 0.2; // Up to 20% bonus
    points = points * (1 + timeBonus);
  }

  return Math.round(points);
};

/**
 * Example usage and test cases
 */
const examples = () => {
  console.log('=== Adaptive Difficulty Engine Examples ===\n');

  // Example 1: High accuracy, fast time -> Increase difficulty
  console.log('Example 1: High performer');
  console.log('Input:', { accuracy: 90, averageTime: 15, currentDifficulty: 'medium' });
  console.log('Output:', getNextDifficulty({ accuracy: 90, averageTime: 15, currentDifficulty: 'medium' }));
  console.log('Expected: hard\n');

  // Example 2: Low accuracy -> Decrease difficulty
  console.log('Example 2: Struggling student');
  console.log('Input:', { accuracy: 30, averageTime: 25, currentDifficulty: 'medium' });
  console.log('Output:', getNextDifficulty({ accuracy: 30, averageTime: 25, currentDifficulty: 'medium' }));
  console.log('Expected: easy\n');

  // Example 3: Medium performance -> Keep same
  console.log('Example 3: Average performer');
  console.log('Input:', { accuracy: 65, averageTime: 22, currentDifficulty: 'medium' });
  console.log('Output:', getNextDifficulty({ accuracy: 65, averageTime: 22, currentDifficulty: 'medium' }));
  console.log('Expected: medium\n');

  // Example 4: High accuracy but slow -> Keep same
  console.log('Example 4: Accurate but slow');
  console.log('Input:', { accuracy: 85, averageTime: 25, currentDifficulty: 'medium' });
  console.log('Output:', getNextDifficulty({ accuracy: 85, averageTime: 25, currentDifficulty: 'medium' }));
  console.log('Expected: medium\n');
};

module.exports = {
  getNextDifficulty,
  calculatePoints,
  examples
};

