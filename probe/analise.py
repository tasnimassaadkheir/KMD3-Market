import csv, io, zipfile, collections, sys, subprocess
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "xlrd"], check=False)
out = open("out/analise.txt", "w")
try:
    import xlrd
    b = xlrd.open_workbook("out/dicionario.xls")
    for sh in b.sheets():
        out.write(f"== sheet {sh.name}\n")
        for r in range(sh.nrows):
            row = [str(c.value).strip() for c in sh.row(r) if str(c.value).strip()]
            if row: out.write(" | ".join(row)[:300] + "\n")
except Exception as e:
    out.write(f"dict error {e}\n")
z = zipfile.ZipFile("osasco.zip")
f = io.TextIOWrapper(z.open(z.namelist()[0]), encoding="latin1")
r = csv.DictReader(f, delimiter=";")
esp = collections.Counter(); tipo = collections.Counter(); nv = collections.Counter(); comp = collections.Counter()
predios = collections.defaultdict(lambda: {"n": 0, "lat": 0.0, "lng": 0.0, "bairro": collections.Counter()})
for row in r:
    esp[row["COD_ESPECIE"]] += 1
    tipo[(row["COD_ESPECIE"], row.get("COD_TIPO_ESPECI", ""))] += 1
    nv[row["NV_GEO_COORD"]] += 1
    comp[row["NOM_COMP_ELEM1"]] += 1
    if row.get("COD_TIPO_ESPECI") == "103" or row["NOM_COMP_ELEM1"].upper().startswith("APARTAMENTO"):
        k = (row["CEP"], row["NOM_TIPO_SEGLOGR"], row["NOM_TITULO_SEGLOGR"], row["NOM_SEGLOGR"], row["NUM_ENDERECO"])
        p = predios[k]; p["n"] += 1
        try: p["lat"] += float(row["LATITUDE"]); p["lng"] += float(row["LONGITUDE"])
        except: pass
        p["bairro"][row["DSC_LOCALIDADE"]] += 1
out.write(f"especie {esp.most_common()}\n")
out.write(f"tipo {tipo.most_common(30)}\n")
out.write(f"nv_geo {nv.most_common()}\n")
out.write(f"comp1 {comp.most_common(25)}\n")
tam = [p["n"] for p in predios.values()]
for lim in (2, 10, 50, 100, 200, 300):
    out.write(f">= {lim}: {sum(1 for t in tam if t >= lim)}\n")
top = sorted(predios.items(), key=lambda kv: -kv[1]["n"])[:25]
for k, p in top:
    out.write(f"{p['n']:5d} {' '.join(x for x in k[1:] if x)} | CEP {k[0]} | {p['bairro'].most_common(1)[0][0]} | {p['lat']/p['n']:.5f},{p['lng']/p['n']:.5f}\n")
