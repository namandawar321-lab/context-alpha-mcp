function generateMermaidDiagram(blueprint) {
  let diagram = `flowchart TD\n`;

  // Trigger
  diagram += `START([${blueprint.trigger}])\n`;

  let lastNode = "START";

  blueprint.steps.forEach((step, index) => {
    const nodeId = `STEP${index}`;
    diagram += `${nodeId}[${step.action}]\n`;
    diagram += `${lastNode} --> ${nodeId}\n`;
    lastNode = nodeId;
  });

  diagram += `${lastNode} --> END([End])\n`;

  return diagram;
}

module.exports = { generateMermaidDiagram };
