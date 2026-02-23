import { DataTypes } from "sequelize";

export const defineDemoRequestModel = (sequelize) => {
  const DemoRequest = sequelize.define(
    "DemoRequest",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fullName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      companyName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      companyWebsite: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      employees: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      interests: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      approvedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      trialStartsAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      trialEndsAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "demo_requests",
      timestamps: true,
    }
  );

  return DemoRequest;
};
