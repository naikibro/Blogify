import { execSync } from "child_process";

console.log("Deploying to dev...");
try {
  execSync("serverless deploy --stage dev", {
    encoding: "utf-8",
    shell: "/bin/zsh",
    stdio: "inherit",
  });
  console.log("\nDeployment complete!\n");
} catch (error: unknown) {
  console.error("Deployment failed!");
  process.exit(1);
}

let apiUrl: string;
try {
  const output = execSync(
    "serverless info 2>&1 | cat | grep -o 'https://[^ ]*/\\(dev\\|prod\\)' | head -1",
    {
      encoding: "utf-8",
      shell: "/bin/zsh",
    }
  );
  apiUrl = output.trim();
} catch (error: unknown) {
  // If grep doesn't find a match, try to extract from stderr
  const err = error as { stderr?: string; output?: string[]; message?: string };
  const stderr = err.stderr || err.output?.[2] || "";
  const match = stderr.match(/https:\/\/[^ ]+\/(dev|prod)/);
  if (match) {
    apiUrl = match[0];
  } else {
    console.error("Could not extract API URL from serverless info output");
    console.error(stderr || err.message || String(error));
    process.exit(1);
  }
}

if (apiUrl) {
  process.stdout.write("\x1B[2J\x1B[H");
  console.log("");
  console.log("Add this to your frontend/.env.local file:");
  console.log(`NEXT_PUBLIC_API_URL=${apiUrl}`);
} else {
  console.error("Could not extract API URL from serverless info output");
  process.exit(1);
}
