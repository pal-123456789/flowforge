import { promises as fs } from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "data", "outputs");

/** Write a file to the server's data/outputs folder (sanitized name). */
export async function writeOutputFile(
  filename: string,
  content: string
): Promise<string> {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "output.txt";
  const full = path.join(OUT_DIR, safe);
  await fs.writeFile(full, content, "utf8");
  return path.join("data", "outputs", safe);
}
