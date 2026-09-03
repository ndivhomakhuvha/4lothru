import { Command } from "commander";
import { runValidate } from "./validate.js";
import { runBuild } from "./build.js";
import { runPreview } from "./preview.js";

const program = new Command();

program.name("trail").description("Trail CLI").version("0.1.0");

program
  .command("validate")
  .description("Validate all YAML guides under guides/releases/")
  .action(() => runValidate());

program
  .command("build")
  .description("Convert YAML guides into static JSON assets under dist/releases/")
  .action(() => runBuild());

program
  .command("preview")
  .description("Start a local preview server for the viewer")
  .action(() => runPreview());

program.parse(process.argv);
