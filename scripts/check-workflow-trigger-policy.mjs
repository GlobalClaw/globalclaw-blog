import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const matrix = JSON.parse(
  readFileSync(path.join(repoRoot, 'config/workflow-trigger-policy.json'), 'utf8'),
);

function getIndentedBlock(lines, startIndex, indentLevel) {
  const block = [];

  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    const indent = line.match(/^ */)[0].length;
    if (indent <= indentLevel) {
      break;
    }

    block.push({ line, indent, index: i });
  }

  return block;
}

function extractEventPaths(content, eventName) {
  const lines = content.split(/\r?\n/);
  const eventHeader = new RegExp(`^  ${eventName}:\\s*(?:&[A-Za-z0-9_-]+)?\\s*$`);
  const eventIndex = lines.findIndex((line) => eventHeader.test(line));

  if (eventIndex === -1) {
    return null;
  }

  const eventBlock = getIndentedBlock(lines, eventIndex, 2);
  const pathLine = eventBlock.find(({ line }) => /^    paths:\s*(?:&([A-Za-z0-9_-]+)|\*([A-Za-z0-9_-]+))?\s*$/.test(line));

  if (!pathLine) {
    return [];
  }

  const match = pathLine.line.match(/^    paths:\s*(?:&([A-Za-z0-9_-]+)|\*([A-Za-z0-9_-]+))?\s*$/);
  const referencedAnchor = match?.[2] ?? null;

  if (referencedAnchor) {
    const anchorLineIndex = lines.findIndex((line) => new RegExp(`^    paths:\\s*&${referencedAnchor}\\s*$`).test(line));

    if (anchorLineIndex === -1) {
      throw new Error(`Could not resolve YAML anchor *${referencedAnchor} in workflow file.`);
    }

    return extractPathsList(lines, anchorLineIndex);
  }

  return extractPathsList(lines, pathLine.index);
}

function extractPathsList(lines, pathsIndex) {
  const pathEntries = [];

  for (let i = pathsIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    const indent = line.match(/^ */)[0].length;
    if (indent <= 4) {
      break;
    }

    const match = line.match(/^      - '([^']+)'\s*$/);
    if (!match) {
      throw new Error(`Unsupported paths entry format: ${line}`);
    }

    pathEntries.push(match[1]);
  }

  return pathEntries;
}

function compareList(name, actual, expected, errors) {
  const actualJoined = actual.join('\n');
  const expectedJoined = expected.join('\n');

  if (actualJoined !== expectedJoined) {
    errors.push([
      `${name} paths drifted.`,
      'Expected:',
      ...expected.map((entry) => `  - ${entry}`),
      'Actual:',
      ...actual.map((entry) => `  - ${entry}`),
    ].join('\n'));
  }
}

const errors = [];

for (const workflow of matrix.workflows) {
  const workflowPath = path.join(repoRoot, workflow.file);
  const content = readFileSync(workflowPath, 'utf8');

  for (const [eventName, expectedPaths] of Object.entries(workflow.events ?? {})) {
    const actualPaths = extractEventPaths(content, eventName);

    if (actualPaths === null) {
      errors.push(`${workflow.file} is missing expected event '${eventName}'.`);
      continue;
    }

    compareList(`${workflow.file} (${eventName})`, actualPaths, expectedPaths, errors);
  }
}

for (const rule of matrix.symmetryRules ?? []) {
  const [leftWorkflow, leftEvent] = rule.left;
  const [rightWorkflow, rightEvent] = rule.right;
  const left = matrix.workflows.find((workflow) => workflow.id === leftWorkflow);
  const right = matrix.workflows.find((workflow) => workflow.id === rightWorkflow);

  if (!left || !right) {
    errors.push(`Invalid symmetry rule '${rule.name}': unknown workflow id.`);
    continue;
  }

  const leftPaths = left.events?.[leftEvent] ?? [];
  const rightPaths = right.events?.[rightEvent] ?? [];

  const leftSubset = rule.paths;
  const leftMissing = leftSubset.filter((entry) => !leftPaths.includes(entry));
  const rightMissing = leftSubset.filter((entry) => !rightPaths.includes(entry));

  if (leftMissing.length || rightMissing.length) {
    errors.push([
      `Symmetry rule failed: ${rule.name}`,
      `Expected both ${left.file} (${leftEvent}) and ${right.file} (${rightEvent}) to include:`,
      ...leftSubset.map((entry) => `  - ${entry}`),
      ...(leftMissing.length ? ['Missing on left:', ...leftMissing.map((entry) => `  - ${entry}`)] : []),
      ...(rightMissing.length ? ['Missing on right:', ...rightMissing.map((entry) => `  - ${entry}`)] : []),
    ].join('\n'));
  }
}

if (errors.length > 0) {
  console.error('Workflow trigger policy check failed.\n');
  for (const error of errors) {
    console.error(`- ${error}\n`);
  }
  process.exit(1);
}

console.log('Workflow trigger policy check passed.');
