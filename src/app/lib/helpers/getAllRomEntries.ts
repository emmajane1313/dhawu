import { Larramu } from "@/app/components/types/components.type";
import fs from "fs";
import path from "path";

export const getAllRomEntries = (): Larramu[] => {
  const dhurruDir = path.resolve(process.cwd(), "public/dhuwurr");
  const files = fs.readdirSync(dhurruDir);

  const entries: Larramu[] = [];

  files.forEach((fileName) => {
    if (fileName.endsWith(".json")) {
      const filePath = path.join(dhurruDir, fileName);
      const rawData = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(rawData);

      const pageMatch = fileName.match(/(\d+)\.json$/);
      const pageNumber = pageMatch ? pageMatch[1] : "unknown";

      for (const word of data) {
        entries.push({
          contenido: word,
          pagina: `/wukirri/rom/${pageNumber}`,
        });
      }
    }
  });

  return entries;
};
