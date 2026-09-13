const express = require("express");
const dotenv = require("dotenv");

const urlRoutes = require("./routes/url");
const { handleRedirectShortURL } = require("./controllers/url");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());

app.use("/url", urlRoutes);

app.get("/:shortId", handleRedirectShortURL);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});