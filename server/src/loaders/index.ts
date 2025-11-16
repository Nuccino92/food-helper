import expressLoader from "./express";
import { Application } from "express";

// This is the main loader function that will be called from app.ts
export default async ({ expressApp }: { expressApp: Application }) => {
  // Call the express loader to configure the app
  await expressLoader({ app: expressApp });
  console.log("✅ Express loaded");

  // ... In the future, you could add other loaders here
  // await databaseLoader();
  // console.log('✅ Database loaded');
};
