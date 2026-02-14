const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamified-learning';

async function seedDemoData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Quiz.deleteMany({});
    await Attempt.deleteMany({});
    console.log('Cleared existing data');

    // Create demo teacher
    const teacher = new User({
      name: 'Dr. Sarah Johnson',
      email: 'teacher@demo.com',
      password: 'teacher123',
      role: 'teacher'
    });
    await teacher.save();
    console.log('✅ Created teacher:', teacher.email);

    // Create demo students
    const students = [
      { name: 'Alice Smith', email: 'alice@demo.com', password: 'student123', level: 5, totalPoints: 450, badges: ['Level 5', 'Excellent', 'High Scorer'] },
      { name: 'Bob Williams', email: 'bob@demo.com', password: 'student123', level: 3, totalPoints: 280, badges: ['Level 3'] },
      { name: 'Charlie Brown', email: 'charlie@demo.com', password: 'student123', level: 2, totalPoints: 150, badges: ['Level 2'] },
      { name: 'Diana Prince', email: 'diana@demo.com', password: 'student123', level: 4, totalPoints: 380, badges: ['Level 4', 'Excellent'] },
      { name: 'Eve Davis', email: 'eve@demo.com', password: 'student123', level: 1, totalPoints: 80, badges: ['Level 1'] }
    ];

    const createdStudents = [];
    for (const studentData of students) {
      const student = new User({
        ...studentData,
        role: 'student',
        totalQuizzesAttempted: Math.floor(Math.random() * 10) + 1,
        averageAccuracy: Math.floor(Math.random() * 40) + 50
      });
      await student.save();
      createdStudents.push(student);
      console.log('✅ Created student:', student.email);
    }

    // Create demo quizzes
    const quiz1 = new Quiz({
      title: 'JavaScript Fundamentals',
      description: 'Test your knowledge of JavaScript basics',
      createdBy: teacher._id,
      difficulty: 'medium',
      questions: [
        {
          questionText: 'What is the correct way to declare a variable in JavaScript?',
          options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
          correctAnswer: 0,
          difficulty: 'easy',
          topic: 'Variables',
          points: 10,
          timeLimit: 30
        },
        {
          questionText: 'Which method is used to add an element to the end of an array?',
          options: ['push()', 'pop()', 'shift()', 'unshift()'],
          correctAnswer: 0,
          difficulty: 'easy',
          topic: 'Arrays',
          points: 10,
          timeLimit: 30
        },
        {
          questionText: 'What does the "this" keyword refer to in JavaScript?',
          options: ['The current function', 'The global object', 'The object that owns the function', 'The parent object'],
          correctAnswer: 2,
          difficulty: 'medium',
          topic: 'Objects',
          points: 15,
          timeLimit: 45
        },
        {
          questionText: 'What is a closure in JavaScript?',
          options: [
            'A function that has access to variables in its outer scope',
            'A way to close a function',
            'A method to hide variables',
            'A type of loop'
          ],
          correctAnswer: 0,
          difficulty: 'hard',
          topic: 'Advanced Concepts',
          points: 20,
          timeLimit: 60
        },
        {
          questionText: 'Which of the following is NOT a JavaScript data type?',
          options: ['String', 'Number', 'Boolean', 'Float'],
          correctAnswer: 3,
          difficulty: 'easy',
          topic: 'Data Types',
          points: 10,
          timeLimit: 30
        }
      ]
    });
    await quiz1.save();
    console.log('✅ Created quiz: JavaScript Fundamentals');

    const quiz2 = new Quiz({
      title: 'React Basics',
      description: 'Learn React fundamentals',
      createdBy: teacher._id,
      difficulty: 'medium',
      questions: [
        {
          questionText: 'What is JSX?',
          options: [
            'A JavaScript extension for XML',
            'A React component',
            'A state management library',
            'A build tool'
          ],
          correctAnswer: 0,
          difficulty: 'easy',
          topic: 'JSX',
          points: 10,
          timeLimit: 30
        },
        {
          questionText: 'What hook is used to manage state in functional components?',
          options: ['useState', 'useEffect', 'useContext', 'useReducer'],
          correctAnswer: 0,
          difficulty: 'medium',
          topic: 'Hooks',
          points: 15,
          timeLimit: 45
        },
        {
          questionText: 'What is the purpose of useEffect hook?',
          options: [
            'To manage component state',
            'To perform side effects in functional components',
            'To create new components',
            'To handle events'
          ],
          correctAnswer: 1,
          difficulty: 'medium',
          topic: 'Hooks',
          points: 15,
          timeLimit: 45
        },
        {
          questionText: 'How do you pass data from parent to child component?',
          options: ['Using state', 'Using props', 'Using context', 'Using refs'],
          correctAnswer: 1,
          difficulty: 'easy',
          topic: 'Props',
          points: 10,
          timeLimit: 30
        }
      ]
    });
    await quiz2.save();
    console.log('✅ Created quiz: React Basics');

    // Create demo attempts
    const createAttempt = async (student, quiz, answersData) => {
      const answers = answersData.map((ans, idx) => ({
        questionId: quiz.questions[idx]._id,
        selectedAnswer: ans.selected,
        isCorrect: ans.selected === quiz.questions[idx].correctAnswer,
        timeTaken: ans.time,
        difficulty: quiz.questions[idx].difficulty,
        pointsEarned: ans.selected === quiz.questions[idx].correctAnswer 
          ? quiz.questions[idx].points 
          : 0
      }));

      const attempt = new Attempt({
        studentId: student._id,
        quizId: quiz._id,
        answers,
        difficultyProgression: quiz.questions.map(q => q.difficulty),
        feedback: {
          strengths: ['Variables', 'Arrays'],
          weaknesses: ['Advanced Concepts'],
          suggestions: ['Focus on revising: Advanced Concepts'],
          personalizedMessage: 'Good job! You scored 75%. You showed strong understanding in Variables, Arrays. Consider reviewing Advanced Concepts to improve further.'
        }
      });

      await attempt.save();
      return attempt;
    };

    // Create some demo attempts
    await createAttempt(createdStudents[0], quiz1, [
      { selected: 0, time: 15 },
      { selected: 0, time: 12 },
      { selected: 2, time: 35 },
      { selected: 0, time: 50 },
      { selected: 3, time: 20 }
    ]);

    await createAttempt(createdStudents[1], quiz1, [
      { selected: 0, time: 20 },
      { selected: 1, time: 25 },
      { selected: 2, time: 40 },
      { selected: 1, time: 55 },
      { selected: 3, time: 28 }
    ]);

    await createAttempt(createdStudents[0], quiz2, [
      { selected: 0, time: 18 },
      { selected: 0, time: 30 },
      { selected: 1, time: 38 },
      { selected: 1, time: 22 }
    ]);

    console.log('✅ Created demo attempts');

    console.log('\n🎉 Demo data seeded successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('Teacher: teacher@demo.com / teacher123');
    console.log('Students: alice@demo.com / student123');
    console.log('         bob@demo.com / student123');
    console.log('         charlie@demo.com / student123');
    console.log('         diana@demo.com / student123');
    console.log('         eve@demo.com / student123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedDemoData();

