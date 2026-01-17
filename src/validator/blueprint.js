const { z } = require("zod");

const BlueprintSchema = z.object({
  name: z.string(),
  trigger: z.string(),
  steps: z.array(
    z.object({
      action: z.string(),
      params: z.record(z.any())
    })
  )
});

module.exports = { BlueprintSchema };
