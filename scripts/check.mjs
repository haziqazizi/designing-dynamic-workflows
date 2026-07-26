import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const skill = readFileSync(join(root, "SKILL.md"), "utf8");
const adapter = readFileSync(join(root, "reference", "pi-dynamic-workflows.md"), "utf8");

assert.equal(pkg.name, "@haziqazizi/designing-dynamic-workflows");
assert.deepEqual(pkg.pi?.skills, ["."]);
assert.match(skill, /^---\nname: designing-dynamic-workflows\n/m);
assert.match(skill, /reference\/pi-dynamic-workflows\.md/);
for (const reference of [
  "concepts-and-examples.md",
  "six-axes.md",
  "convergence-and-selection.md",
  "composition-patterns.md",
  "rubrics-and-gates.md",
  "antipatterns.md",
  "creative-generation.md",
  "implementations.md",
  "pi-dynamic-workflows.md",
]) {
  assert.equal(existsSync(join(root, "reference", reference)), true, `missing reference/${reference}`);
}
assert.match(adapter, /workflow-authoring\/SKILL\.md/);
assert.match(adapter, /workflow-patterns\/SKILL\.md/);
assert.match(adapter, /extensions\.workflow/);
assert.match(adapter, /extensions\.workflow_control/);
console.log("designing-dynamic-workflows: package and Pi runtime adapter verified");
