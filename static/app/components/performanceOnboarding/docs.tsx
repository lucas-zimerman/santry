type Content = {
  CONFIGURE: string;
  INSTALL: string;
  VERIFY: string;
};
type WizardType = Record<string, Content>;

const WIZARD: WizardType = {
  javascript: {
    INSTALL: `
#### Install

Install the tracing package. Without this, you're missing out on tracing.

\`\`\`sh
# Using yarn
yarn add @sentry/browser @sentry/tracing

# Using npm
npm install --save @sentry/browser @sentry/tracing
\`\`\`
    `,
    CONFIGURE: `
#### Configure

Sampling for transactions must also be configured before tracing is be enabled in your app.

\`\`\`js
import * as Sentry from "@sentry/browser";

// If taking advantage of automatic instrumentation (highly recommended)
import { BrowserTracing } from "@sentry/tracing";
// Or, if only manually tracing
// import * as _ from "@sentry/tracing"
// Note: You MUST import the package in some way for tracing to work

Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",

  // This enables automatic instrumentation (highly recommended), but is not
  // necessary for purely manual usage
  integrations: [new BrowserTracing()],

  // To set a uniform sample rate
  tracesSampleRate: 0.2

  // Alternatively, to control sampling dynamically
  tracesSampler: samplingContext => { ... }
});
\`\`\`
    `,
    VERIFY: `
#### Verify

Verify that performance monitoring is working correctly by using our automatic instrumentation or by starting and finishing a transaction using custom instrumentation.

\`\`\`js
const transaction = Sentry.startTransaction({ name: "test-transaction" });
const span = transaction.startChild({ op: "functionX" }); // This function returns a Span
// functionCallX
span.finish(); // Remember that only finished spans will be sent with the transaction
transaction.finish(); // Finishing the transaction will send it to Sentry
\`\`\`
    `,
  },
};

export default WIZARD;
