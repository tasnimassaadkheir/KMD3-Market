// =============================================================================
// KMD3 Market — builds the Prospecção list for cities other than São Paulo,
// from IBGE's address register of the 2022 Census (CNEFE).
// -----------------------------------------------------------------------------
// São Paulo city uses its IPTU register (scripts/iptu.mjs). Other cities (Osasco…)
// don't publish theirs, so we use the CNEFE: one row per dwelling in the city, each
// with its address, its type (101 house, 103 apartment…) and latitude/longitude.
// Apartments at the same address (CEP + street + number) are one building.
//
// Runs on GitHub (workflow "Atualizar prospecção - cidades vizinhas"), for the cities
// listed in scripts/cidades.json. The CNEFE only changes with a new census, so it's
// run by hand.
//
// Usage:
//   node scripts/cnefe.mjs url 3534401                 -> download link of that city's file
//   unzip -p 3534401_OSASCO.zip | node scripts/cnefe.mjs resumir Osasco > osasco.json
//   node scripts/cnefe.mjs juntar dados/prospeccao-vizinhas.json osasco.json barueri.json …
// =============================================================================
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { normalizar, titulo, formatarCep, separarCampos } from "./iptu.mjs";

export const IBGE = "https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/Municipio/";
export const MIN_APTOS = 10;
const APARTAMENTO = "103";          // COD_TIPO_ESPECI: dwelling in an apartment building

// Short, stable id for a building: city code + CEP + number + street.
export function idPredio(codMunicipio, cep, numero, rua){
  return String(codMunicipio).slice(0, 7) + "-" + String(cep).replace(/\D/g, "") + "-" + String(numero).replace(/\W/g, "") + "-" +
    normalizar(rua).replace(/[^a-z0-9]+/g, "").slice(0, 24);
}

// Reads a CNEFE CSV stream (Latin-1, ";") and returns the same compact format as the
// IPTU list, plus each building's position ("lat", "lng") — no address lookup needed.
export async function resumirCnefe(stream, cidade, minimo = MIN_APTOS){
  const grupos = new Map();
  const decod = new TextDecoder("latin1");
  let resto = "", cols = null, lidas = 0, codMunicipio = "";
  const processar = (texto, fim) => {
    const partes = (resto + texto).split("\n");
    resto = fim ? "" : partes.pop();
    for(let linha of partes){
      if(linha.endsWith("\r")) linha = linha.slice(0, -1);
      if(!linha.trim()) continue;
      const c = separarCampos(linha, ";");
      if(!cols){
        cols = {}; c.forEach((h, i) => { cols[h.trim().toUpperCase()] = i; });
        for(const k of ["COD_MUNICIPIO", "CEP", "NOM_TIPO_SEGLOGR", "NOM_SEGLOGR", "NUM_ENDERECO", "COD_TIPO_ESPECI", "LATITUDE", "LONGITUDE"])
          if(cols[k] === undefined) throw new Error("Coluna " + k + " não encontrada no arquivo do CNEFE");
        continue;
      }
      lidas++;
      if(c[cols.COD_TIPO_ESPECI] !== APARTAMENTO) continue;
      codMunicipio = codMunicipio || c[cols.COD_MUNICIPIO];
      const rua = [c[cols.NOM_TIPO_SEGLOGR], cols.NOM_TITULO_SEGLOGR !== undefined ? c[cols.NOM_TITULO_SEGLOGR] : "", c[cols.NOM_SEGLOGR]]
        .map(x => String(x || "").trim()).filter(Boolean).join(" ");
      const numero = String(c[cols.NUM_ENDERECO] || "").trim();
      const cep = c[cols.CEP];
      const k = cep + "|" + rua + "|" + numero;
      let g = grupos.get(k);
      if(!g){ g = {rua, numero, cep, n:0, lat:0, lng:0, nPos:0, bairros:new Map()}; grupos.set(k, g); }
      g.n++;
      const lat = parseFloat(c[cols.LATITUDE]), lng = parseFloat(c[cols.LONGITUDE]);
      if(isFinite(lat) && isFinite(lng) && lat && lng){ g.lat += lat; g.lng += lng; g.nPos++; }
      const b = cols.DSC_LOCALIDADE !== undefined ? String(c[cols.DSC_LOCALIDADE] || "").trim() : "";
      if(b) g.bairros.set(b, (g.bairros.get(b) || 0) + 1);
    }
  };
  for await (const pedaco of stream){
    const chunk = pedaco instanceof Uint8Array ? pedaco : Buffer.from(pedaco);
    processar(decod.decode(chunk, {stream:true}), false);
  }
  processar(decod.decode(), true);
  if(!cols) throw new Error("CSV vazio");
  const linhas = [];
  grupos.forEach(g => {
    if(g.n < minimo) return;
    let bairro = "", nMax = 0;
    g.bairros.forEach((n, b) => { if(n > nMax){ nMax = n; bairro = b; } });
    const lat = g.nPos ? +(g.lat / g.nPos).toFixed(6) : null, lng = g.nPos ? +(g.lng / g.nPos).toFixed(6) : null;
    linhas.push([idPredio(codMunicipio, g.cep, g.numero, g.rua), titulo(g.rua), g.numero, titulo(bairro), formatarCep(g.cep), g.n, lat, lng]);
  });
  linhas.sort((a, b) => b[5] - a[5] || String(a[0]).localeCompare(String(b[0])));
  return {
    fonte: "CNEFE — Censo 2022 (IBGE)", cidade, ano: 2022, minimoAptos: minimo,
    geradoEm: new Date().toISOString(), total: linhas.length, linhasLidas: lidas,
    campos: ["id", "logradouro", "numero", "bairro", "cep", "apartamentos", "lat", "lng"],
    linhas
  };
}

// Joins several cities into one file for the page: same fields plus "cidade"
// (position in the 'cidades' list).
export function juntar(partes){
  const cidades = partes.map(p => ({nome: p.cidade, total: p.total, ano: p.ano}));
  const linhas = [];
  partes.forEach((p, i) => p.linhas.forEach(l => linhas.push(l.concat(i))));
  linhas.sort((a, b) => b[5] - a[5] || String(a[0]).localeCompare(String(b[0])));
  return {
    fonte: "CNEFE — Censo 2022 (IBGE)", ano: 2022, minimoAptos: partes[0] ? partes[0].minimoAptos : MIN_APTOS,
    geradoEm: new Date().toISOString(), total: linhas.length, cidades,
    campos: ["id", "logradouro", "numero", "bairro", "cep", "apartamentos", "lat", "lng", "cidade"],
    linhas
  };
}

// Download link of a city's file, from IBGE's folder of São Paulo state (35_SP).
export async function urlMunicipio(codigo){
  const pasta = IBGE + "35_SP/";
  const html = await (await fetch(pasta, {signal: AbortSignal.timeout(60000)})).text();
  const nome = (html.match(new RegExp('href="(' + codigo + '_[^"]+\\.zip)"')) || [])[1];
  if(!nome) throw new Error("Arquivo do município " + codigo + " não encontrado no IBGE");
  return pasta + nome;
}

// ---------- command line ----------
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href){
  const [cmd, a, b] = process.argv.slice(2);
  if(cmd === "url"){
    console.log(await urlMunicipio(a));
  } else if(cmd === "juntar"){
    const partes = process.argv.slice(4).map(f => JSON.parse(fs.readFileSync(f, "utf8")));
    const r = juntar(partes);
    fs.writeFileSync(a, JSON.stringify(r));
    console.error(a + ": " + r.cidades.map(c => c.nome + " " + c.total).join(", "));
  } else if(cmd === "resumir"){
    const r = await resumirCnefe(process.stdin, a || "", b ? +b : MIN_APTOS);
    if(!r.total) throw new Error("Nenhum prédio encontrado no arquivo");
    process.stdout.write(JSON.stringify(r));
    console.error(r.cidade + " (CNEFE 2022): " + r.linhasLidas + " linhas lidas, " + r.total + " prédios com " + r.minimoAptos + "+ apartamentos");
  } else {
    console.error("uso: node scripts/cnefe.mjs url <código IBGE> | resumir <cidade> [mínimo] | juntar <saída.json> <cidade.json>…");
    process.exit(2);
  }
}
