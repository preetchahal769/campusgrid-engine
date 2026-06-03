import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: "https://fe5366e0a76ce995fb10e29f4715a63c@o4511499164254208.ingest.de.sentry.io/4511499679957072",
  // We disable enableLogs to save Sentry quota (errors are still captured)
  enableLogs: false,
  sendDefaultPii: true,
});
