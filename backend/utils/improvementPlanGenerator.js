/**
 * PERSONALIZED IMPROVEMENT PLAN GENERATOR
 * 
 * Auto-generates:
 * - Topics to revise
 * - Difficulty level to practice
 * - Number of recommended questions
 * 
 * Example: "Practice 8 Easy and 5 Medium questions from Algebra → Linear Equations."
 */

const generateImprovementPlan = (gapAnalysis, timeAnalysis, mistakePatterns, confidenceScore) => {
  const plan = {
    priority: 'high',
    topics: [],
    practicePlan: [],
    timeline: '1-2 weeks',
    summary: ''
  };

  // Extract weak topics from gap analysis
  const weakTopics = gapAnalysis.weakAreas || [];
  const rootCauses = gapAnalysis.rootCauses || [];

  // Generate practice plan for each weak topic
  weakTopics.forEach(area => {
    const rootCause = rootCauses.find(rc => rc.topic === area.topic);
    const severity = rootCause?.severity || 'medium';

    // Determine difficulty and number of questions based on performance
    let easyQuestions = 0;
    let mediumQuestions = 0;
    let hardQuestions = 0;

    if (area.accuracy < 40) {
      // Very weak - start with easy
      easyQuestions = Math.max(10, Math.ceil(area.totalQuestions * 2));
      mediumQuestions = Math.ceil(area.totalQuestions * 0.5);
    } else if (area.accuracy < 60) {
      // Weak - mix of easy and medium
      easyQuestions = Math.ceil(area.totalQuestions * 1.2);
      mediumQuestions = Math.ceil(area.totalQuestions * 1.5);
    } else {
      // Moderate - focus on medium
      mediumQuestions = Math.ceil(area.totalQuestions * 1.5);
      hardQuestions = Math.ceil(area.totalQuestions * 0.5);
    }

    // Adjust based on time performance
    if (area.avgTime > 45) {
      // Slow - add more practice
      easyQuestions = Math.ceil(easyQuestions * 1.2);
      mediumQuestions = Math.ceil(mediumQuestions * 1.2);
    }

    plan.practicePlan.push({
      topic: area.topic,
      priority: severity,
      recommendations: [
        ...(easyQuestions > 0 ? [{
          difficulty: 'easy',
          questions: easyQuestions,
          reason: 'Build fundamental understanding',
          estimatedTime: `${Math.ceil(easyQuestions * 2)} minutes`
        }] : []),
        ...(mediumQuestions > 0 ? [{
          difficulty: 'medium',
          questions: mediumQuestions,
          reason: 'Practice application of concepts',
          estimatedTime: `${Math.ceil(mediumQuestions * 3)} minutes`
        }] : []),
        ...(hardQuestions > 0 ? [{
          difficulty: 'hard',
          questions: hardQuestions,
          reason: 'Challenge yourself',
          estimatedTime: `${Math.ceil(hardQuestions * 4)} minutes`
        }] : [])
      ],
      focusAreas: rootCause?.causes || [],
      message: `Practice ${easyQuestions + mediumQuestions + hardQuestions} questions from ${area.topic}. Start with ${easyQuestions > 0 ? `${easyQuestions} Easy` : ''}${easyQuestions > 0 && mediumQuestions > 0 ? ' and ' : ''}${mediumQuestions > 0 ? `${mediumQuestions} Medium` : ''} questions.`
    });
  });

  // Add recommendations from time analysis
  if (timeAnalysis.slowButCorrect.length > 0) {
    plan.practicePlan.push({
      topic: 'Speed Practice',
      priority: 'medium',
      recommendations: [{
        difficulty: 'medium',
        questions: timeAnalysis.slowButCorrect.length * 2,
        reason: 'Improve response speed while maintaining accuracy',
        estimatedTime: `${Math.ceil(timeAnalysis.slowButCorrect.length * 2 * 2)} minutes`
      }],
      message: `Practice ${timeAnalysis.slowButCorrect.length * 2} questions to improve your speed. You understand the concepts but need to answer faster.`
    });
  }

  // Add recommendations from mistake patterns
  if (mistakePatterns.repeatedMistakes.length > 0) {
    const repeatedTopics = [...new Set(mistakePatterns.repeatedMistakes.map(m => m.topic))];
    repeatedTopics.forEach(topic => {
      plan.practicePlan.push({
        topic: `${topic} (Revision)`,
        priority: 'high',
        recommendations: [{
          difficulty: 'easy',
          questions: 8,
          reason: 'Reinforce concepts you keep missing',
          estimatedTime: '16 minutes'
        }],
        message: `Revise ${topic} with 8 easy questions. You've made repeated mistakes here - focus on understanding the fundamentals.`
      });
    });
  }

  // Generate summary
  const totalQuestions = plan.practicePlan.reduce((sum, p) => {
    return sum + p.recommendations.reduce((s, r) => s + r.questions, 0);
  }, 0);

  plan.summary = `Based on your performance, we recommend practicing ${totalQuestions} questions across ${plan.practicePlan.length} topic(s). Focus on ${weakTopics.slice(0, 2).map(t => t.topic).join(' and ')}${weakTopics.length > 2 ? ' and more' : ''}.`;

  // Set overall priority
  if (weakTopics.some(t => gapAnalysis.rootCauses.find(rc => rc.topic === t.topic)?.severity === 'high')) {
    plan.priority = 'high';
  } else if (weakTopics.length > 0) {
    plan.priority = 'medium';
  } else {
    plan.priority = 'low';
  }

  return plan;
};

module.exports = { generateImprovementPlan };

