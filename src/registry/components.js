const components = {
  triggers: [
    {
      id: "http_webhook",
      description: "Triggers workflow on HTTP request",
      inputs: ["payload"]
    }
  ],

  actions: [
    {
      id: "log_event",
      description: "Logs an internal event",
      inputs: ["message"],
      requiresAuth: false
    },
    {
      id: "send_email",
      description: "Send email using SMTP",
      inputs: ["to", "subject", "body"],
      requiresAuth: true
    }
  ]
};

module.exports = { components };
