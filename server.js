const express = require("express");
const next = require("next"); // For Next.js SSR
const { sequelize } = require("./models"); // Import sequelize instance
const registerImageSliderPlugin = require("./plugins/examplePlugin"); // Import your plugin

// Initialize Next.js
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Initialize Express
const server = express();

// Sample CMS object (for demonstration purposes)
const cms = {
  contentBlocks: {},
  addContentBlock(name, blockDefinition) {
    this.contentBlocks[name] = blockDefinition;
  },
  renderContentBlock(name) {
    const block = this.contentBlocks[name];
    if (block) {
      return `
        <style>
          ${Object.entries(block.styles)
            .map(([selector, rule]) => `${selector} { ${rule} }`)
            .join("\n")}
        </style>
        ${block.render()}
      `;
    }
    return "";
  },
};

// Database sync and plugin registration
if (process.env.NODE_ENV !== "production") {
  (async () => {
    try {
      await sequelize.authenticate(); // Test DB connection
      console.log("Database connected!");
      await sequelize.sync(); // Sync tables
      console.log("Database synced!");

      // Register the plugin after DB sync
      registerImageSliderPlugin(cms); // Register plugin with CMS object
    } catch (err) {
      console.error("Unable to connect to the database:", err);
    }
  })();
}

server.use(express.json()); // For parsing JSON request bodies

// Route to render a page with the image-slider plugin
server.get("/image-slider", (req, res) => {
  const sliderHTML = cms.renderContentBlock("image-slider");
  res.send(`
    <html>
      <head>
        <title>Image Slider Plugin</title>
      </head>
      <body>
        <h1>Image Slider</h1>
        ${sliderHTML} <!-- Render the image slider here -->
      </body>
    </html>
  `);
});

// Handling all routes via Next.js
server.all("*", (req, res) => {
  return handle(req, res);
});

// Start the server
app.prepare().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
 