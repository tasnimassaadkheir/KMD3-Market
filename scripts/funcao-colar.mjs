// Builds supabase/functions/admin-usuarios/para-colar.ts: the whole Edge Function in ONE file,
// to paste into Supabase's web editor (Edge Functions → Deploy a new function → Via editor).
// The real source is index.ts + logica.mjs; run `node scripts/funcao-colar.mjs` after changing them
// (a unit test fails if para-colar.ts is out of date).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const pasta = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "functions", "admin-usuarios");

export function montarArquivoUnico(){
  const logica = readFileSync(join(pasta, "logica.mjs"), "utf8").replace(/^export /gm, "");
  const index = readFileSync(join(pasta, "index.ts"), "utf8").replace(/^import \{ tratar \} from "\.\/logica\.mjs";\n/m, "");
  return "// @ts-nocheck\n// GERADO por scripts/funcao-colar.mjs — não edite aqui; edite index.ts e logica.mjs.\n" +
    "// Para colar no editor do Supabase: Edge Functions → Deploy a new function → Via editor → nome: admin-usuarios\n\n" +
    index.replace(/\nDeno\.serve/, "\n" + logica + "\nDeno.serve");
}

if(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
  writeFileSync(join(pasta, "para-colar.ts"), montarArquivoUnico());
  console.log("supabase/functions/admin-usuarios/para-colar.ts atualizado");
}
