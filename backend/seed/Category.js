const Category = require("../models/Category");

const categories = [
  { _id: "65a7e24602e12c44f599442c", name: "RPA Tools" },
  { _id: "65a7e24602e12c44f599442d", name: "Test Automation" },
  { _id: "65a7e24602e12c44f599442e", name: "CI/CD Platforms" },
  { _id: "65a7e24602e12c44f599442f", name: "Infrastructure as Code" },
  { _id: "65a7e24602e12c44f5994430", name: "Configuration Management" },
  { _id: "65a7e24602e12c44f5994431", name: "Workflow Orchestration" },
  { _id: "65a7e24602e12c44f5994432", name: "Process Mining" },
  { _id: "65a7e24602e12c44f5994433", name: "API Automation" },
  { _id: "65a7e24602e12c44f5994434", name: "Mobile Automation" },
  { _id: "65a7e24602e12c44f5994435", name: "Web Automation" },
  { _id: "65a7e24602e12c44f5994436", name: "Database Automation" },
  { _id: "65a7e24602e12c44f5994437", name: "DevOps Tools" },
  { _id: "65a7e24602e12c44f5994438", name: "Monitoring & Analytics" },
  { _id: "65a7e24602e12c44f5994439", name: "Chatbot Platforms" },
  { _id: "65a7e24602e12c44f599443a", name: "Document Processing" },
  { _id: "65a7e24602e12c44f599443b", name: "Business Intelligence" },
  { _id: "65a7e24602e12c44f599443c", name: "Machine Learning" },
  { _id: "65a7e24602e12c44f599443d", name: "Cloud Automation" },
  { _id: "65a7e24602e12c44f599443e", name: "Security Automation" },
  { _id: "65a7e24602e12c44f599443f", name: "Data Pipeline Tools" },
];

exports.seedCategory = async () => {
  try {
    await Category.insertMany(categories);
    console.log("✅ Category seeded successfully");
  } catch (error) {
    console.error("❌ Category seeding failed:", error.message);
    throw error;
  }
};
