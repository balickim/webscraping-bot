const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    dateRange: {
      type: String,
    },
    route: {
      type: String,
    },
    price: {
      type: Number,
    },
    freeSits: {
      type: Number,
    },
    area: {
      type: String,
    },
    link: {
      type: String,
      required: true,
    },
    siteUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Website", websiteSchema);
