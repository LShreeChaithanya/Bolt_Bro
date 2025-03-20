"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };

var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };

Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors")); // ✅ Import CORS
const dotenv_1 = __importDefault(require("dotenv"));
const prompt_1 = require("./prompt");
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");

dotenv_1.default.config();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const app = (0, express_1.default)();

// ✅ Enable CORS
app.use(
  (0, cors_1.default)({
    origin: "http://localhost:5173", // Allow frontend requests
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  })
);

app.use(express_1.default.json());

// ✅ Handle preflight requests (OPTIONS)
app.options("*", (req, res) => {
  res.sendStatus(200);
});

// 🚀 /template Route
app.post("/template", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const prompt = req.body.prompt;

    try {
      const response = yield fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.1-8b-instruct",
            messages: [{ role: "user", content: prompt }],
            system: "Return either 'node' or 'react'. No extra text.",
            temperature: 0.2,
            max_tokens: 100,
          }),
        }
      );

      const data = yield response.json();
      const answer = data.choices[0].message.content.trim().toLowerCase();

      console.log(answer);

      if (answer === "react") {
        return res.json({
          prompts: [
            prompt_1.BASE_PROMPT,
            `The following is a list of project files:\n\n${react_1.basePrompt}\n`,
          ],
          uiPrompts: [react_1.basePrompt],
        });
      }

      if (answer === "node") {
        return res.json({
          prompts: [
            `The following is a list of project files:\n\n${node_1.basePrompt}\n`,
          ],
          uiPrompts: [node_1.basePrompt],
        });
      }

      res.status(403).json({ message: "You can't access this" });
    } catch (error) {
      console.error("Error fetching from OpenRouter:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  })
);

// 🚀 /chat Route (✅ Fixed issue)
app.post("/chat", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const message = req.body.message;

    try {
      const response = yield fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.1-8b-instruct",
            messages: [{ role: "user", content: message }], // ✅ FIXED: Used message instead of prompt
            system: (0, prompt_1.getSystemPrompt)(),
            temperature: 0.2,
            max_tokens: 10,
          }),
        }
      );

      const data = yield response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching from OpenRouter:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  })
);

// 🚀 Start Server
app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
