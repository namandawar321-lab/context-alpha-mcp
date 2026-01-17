const {
  setLatestBlueprint,
  getLatestBlueprint
} = require("./state/latestBlueprint");
const { logAudit } = require("./audit/logger");
const { generateBlueprintFromText } = require("./llm/planner");

const fs = require("fs");
const path = require("path");
const express = require("express");

const { components } = require("./registry/components");
const { BlueprintSchema } = require("./validator/blueprint");
const { generateMermaidDiagram } = require("./utils/mermaid");

const app = express();
app.use(express.json());

/**
 * MCP RESOURCE: Component Registry
 */
app.get("/mcp/resources/components", (req, res) => {
  res.json(components);
});

/**
 * MCP TOOL: Validate Blueprint
 */
app.post("/mcp/tools/validate_blueprint", (req, res) => {
  try {
    const blueprint = BlueprintSchema.parse(req.body);

    // Validate trigger
    const triggerValid = components.triggers.some(
      t => t.id === blueprint.trigger
    );
    if (!triggerValid) {
      throw new Error("Invalid or unauthorized trigger used");
    }

    // Validate actions
    for (const step of blueprint.steps) {
      const actionValid = components.actions.some(
        a => a.id === step.action
      );
      if (!actionValid) {
        throw new Error(`Invalid or unauthorized action: ${step.action}`);
      }
    }

    res.json({
      status: "valid",
      message: "Blueprint is safe, valid, and policy-compliant"
    });

  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
});

/**
 * MCP VISUALIZATION: Mermaid Digital Twin
 */
app.get("/mcp/visualize", (req, res) => {
  try {
    const blueprint = getLatestBlueprint();

    if (!blueprint) {
      return res.send("<h3>No workflow generated yet</h3>");
    }

    // Governance checks (same as before)
    BlueprintSchema.parse(blueprint);

    const triggerValid = components.triggers.some(
      t => t.id === blueprint.trigger
    );
    if (!triggerValid) {
      throw new Error("Invalid or unauthorized trigger used");
    }

    for (const step of blueprint.steps) {
      const actionValid = components.actions.some(
        a => a.id === step.action
      );
      if (!actionValid) {
        throw new Error(`Invalid or unauthorized action: ${step.action}`);
      }
    }

    // Generate Mermaid
    const diagram = generateMermaidDiagram(blueprint);

    // Load template
    const templatePath = path.join(__dirname, "views", "diagram.html");
    let html = fs.readFileSync(templatePath, "utf8");

    html = html.replace("{{DIAGRAM}}", diagram);

    res.send(html);

  } catch (err) {
    res.status(400).send(`<pre>${err.message}</pre>`);
  }
});

/**
 * MCP TOOL: Plan Workflow with Self-Correction + Audit Logging
 */
app.post("/mcp/tools/plan_from_text", async (req, res) => {
  const MAX_ATTEMPTS = 3;
  let attempt = 0;
  let lastError = null;

  try {
    const { prompt } = req.body;
    if (!prompt) {
      throw new Error("Missing natural language prompt");
    }

    while (attempt < MAX_ATTEMPTS) {
      attempt++;

      // 🔹 LLM proposes (or repairs) blueprint
      const blueprint = await generateBlueprintFromText(
        prompt,
        lastError
      );

      // 🔹 AUDIT: Raw LLM output (reasoning trace)
      logAudit({
        type: "LLM_RESPONSE",
        attempt,
        prompt,
        rawBlueprint: blueprint
      });

      setLatestBlueprint(blueprint);


      try {
        // 🔹 Schema validation
        BlueprintSchema.parse(blueprint);

        // 🔹 Registry enforcement
        const triggerValid = components.triggers.some(
          t => t.id === blueprint.trigger
        );
        if (!triggerValid) {
          throw new Error("Invalid trigger proposed");
        }

        for (const step of blueprint.steps) {
          const actionValid = components.actions.some(
            a => a.id === step.action
          );
          if (!actionValid) {
            throw new Error(`Invalid action: ${step.action}`);
          }
        }

        // 🔹 AUDIT: Final accepted plan
        logAudit({
          type: "PLAN_ACCEPTED",
          attempts: attempt,
          blueprint
        });

        // 🔹 Success
        return res.json({
          status: "accepted",
          attempts: attempt,
          blueprint
        });

      } catch (validationError) {
        // 🔹 AUDIT: Validation failure
        logAudit({
          type: "VALIDATION_FAILURE",
          attempt,
          error: validationError.message
        });

        lastError = validationError.message;
      }
    }

    // 🔹 Failed after retries
    res.status(400).json({
      status: "rejected",
      reason: lastError,
      attempts: MAX_ATTEMPTS
    });

  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
});

module.exports = app;
