import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const learningSchema = new mongoose.Schema({
  learnId: {
    type: String,
    required: true,
    unique: true,
  },
  learnName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  signs: [{
    type: String,
    required: true,
  }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Learning = mongoose.model("Learning", learningSchema);

const lessons = [
  {
    learnId: "lesson-001",
    learnName: "Basic Greetings",
    description: "Learn essential greeting signs for everyday communication",
    signs: ["Hello", "Thank You", "Please", "Good Morning", "Goodbye"],
    difficulty: "Beginner",
    correctAnswer: "Hello",
    order: 1,
  },
  {
    learnId: "lesson-002", 
    learnName: "Alphabet A-M",
    description: "Master the first half of the sign language alphabet",
    signs: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
    difficulty: "Beginner",
    correctAnswer: "A",
    order: 2,
  },
  {
    learnId: "lesson-003",
    learnName: "Alphabet N-Z", 
    description: "Complete the sign language alphabet",
    signs: ["N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
    difficulty: "Beginner",
    correctAnswer: "N",
    order: 3,
  },
  {
    learnId: "lesson-004",
    learnName: "Numbers 1-10",
    description: "Learn basic number signs for counting and quantities", 
    signs: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    difficulty: "Intermediate",
    correctAnswer: "1",
    order: 4,
  },
  {
    learnId: "lesson-005",
    learnName: "Common Phrases",
    description: "Essential phrases for basic conversations",
    signs: ["How are you?", "My name is", "Nice to meet you", "I need help", "Where is"],
    difficulty: "Intermediate", 
    correctAnswer: "How are you?",
    order: 5,
  },
  {
    learnId: "lesson-006",
    learnName: "Emergency Signs",
    description: "Critical signs for emergency situations",
    signs: ["Help", "Doctor", "Hospital", "Police", "Danger"],
    difficulty: "Advanced",
    correctAnswer: "Help",
    order: 6,
  },
];

async function runSeeder() {
  try {
    console.log("🚀 Starting lesson seeder...");
    console.log("📡 Connecting to MongoDB...");
    
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");
    
    // Clear existing lessons
    const deleteResult = await Learning.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing lessons`);
    
    // Insert new lessons
    const insertedLessons = await Learning.insertMany(lessons);
    console.log(`✨ Seeded ${insertedLessons.length} lessons successfully`);
    
    // List inserted lessons
    console.log("\n📚 Inserted lessons:");
    insertedLessons.forEach((lesson, index) => {
      console.log(`   ${index + 1}. ${lesson.learnName} (${lesson.difficulty}) - ${lesson.signs.length} signs`);
    });
    
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    console.log("🎉 Seeding completed successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeder();