// import { Sequelize } from "sequelize";
// import "dotenv/config";

// export const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST || "localhost",
//     dialect: "mysql",
//     logging: false,
//   }
// );

// export const initDb = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("MySQL connected");

//     const { setupModels } = await import("../models/index.js");
//     setupModels(sequelize);

//     await sequelize.sync();
//     console.log("Models synced");
//   } catch (err) {
//     console.error("❌ MySQL error:", err.message);
//     throw err;
//   }
// };


import { Sequelize, DataTypes } from "sequelize";
import "dotenv/config";

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

export const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected");

    const { setupModels } = await import("../models/index.js");
    setupModels(sequelize);

    await sequelize.sync();

    // Ensure legacy databases include new worklog fields.
    const queryInterface = sequelize.getQueryInterface();
    const worklogsColumns = await queryInterface.describeTable("worklogs");

    if (!worklogsColumns.taskName) {
      await queryInterface.addColumn("worklogs", "taskName", {
        type: DataTypes.STRING(255),
        allowNull: true,
      });
    }

    if (!worklogsColumns.project) {
      await queryInterface.addColumn("worklogs", "project", {
        type: DataTypes.STRING(255),
        allowNull: true,
      });
    }

    console.log("Models synced");
  } catch (err) {
    console.error("❌ MySQL error:", err.message);
    throw err;
  }
};
